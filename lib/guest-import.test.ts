import { describe, expect, it } from 'vitest'
import { buildGuestImportTemplateCsv, parseGuestImportRows } from '@/lib/guest-import'

describe('parseGuestImportRows', () => {
  it('interpreta nombre completo, tipo y destino de una planilla de invitados', () => {
    const rows = parseGuestImportRows(
      ',,,,\n,NOMBRE,TELEFONO,DESTINO,TIPO\n1,Julieta Petrone,3496-511642,imperial,cena\n2,Caterina Gemin,SIN INGRESO,,cena'
    )

    expect(rows).toEqual([
      {
        first_name: 'Julieta',
        last_name: 'Petrone',
        email: undefined,
        phone: '+5493496511642',
        table_assignment: 'imperial',
        source_type: 'cena',
        sender_group: undefined,
        document_number: undefined,
        companion_names: undefined,
      },
      {
        first_name: 'Caterina',
        last_name: 'Gemin',
        email: undefined,
        phone: '',
        table_assignment: '',
        source_type: 'cena',
        sender_group: undefined,
        document_number: undefined,
        companion_names: undefined,
      },
    ])
  })

  it('mantiene la plantilla histórica de columnas separadas', () => {
    expect(parseGuestImportRows('Nombre,Apellido,Email,Telefono,Destino\nSofia,Gimenez,,342-4496166,Mesa 4')).toEqual([
      {
        first_name: 'Sofia',
        last_name: 'Gimenez',
        email: '',
        phone: '+5493424496166',
        table_assignment: 'Mesa 4',
        source_type: '',
        sender_group: undefined,
        document_number: undefined,
        companion_names: undefined,
      },
    ])
  })

  it('en formato sin encabezado, las 5 columnas clasicas siempre estan presentes', () => {
    expect(parseGuestImportRows('Sofia,Gimenez,,342-4496166,Mesa 4')).toEqual([
      {
        first_name: 'Sofia',
        last_name: 'Gimenez',
        email: '',
        phone: '+5493424496166',
        table_assignment: 'Mesa 4',
        source_type: '',
        sender_group: undefined,
        document_number: undefined,
        companion_names: undefined,
      },
    ])
  })

  it('interpreta Invitado de, DNI y Acompañantes', () => {
    const rows = parseGuestImportRows(
      'Nombre,Apellido,Telefono,Tipo,Invitado de,Acompañantes,DNI,Destino\n' +
        'Sofia,Gimenez,342-4496166,Familia,Mamá,"Juan Pérez; Ana Ruiz",30111222,Mesa 4'
    )

    expect(rows).toEqual([
      {
        first_name: 'Sofia',
        last_name: 'Gimenez',
        email: undefined,
        phone: '+5493424496166',
        table_assignment: 'Mesa 4',
        source_type: 'Familia',
        sender_group: 'Mamá',
        document_number: '30111222',
        companion_names: ['Juan Pérez', 'Ana Ruiz'],
      },
    ])
  })

  it('separa acompañantes por coma cuando no hay punto y coma', () => {
    const rows = parseGuestImportRows('Nombre,Acompañantes\nSofia,"Juan Pérez, Ana Ruiz"')
    expect(rows[0].companion_names).toEqual(['Juan Pérez', 'Ana Ruiz'])
  })

  it('una columna ausente queda undefined; una celda vacia de una columna presente queda en blanco', () => {
    const rows = parseGuestImportRows('Nombre,DNI\nSofia,')
    expect(rows[0].document_number).toBe('')
    expect(rows[0].email).toBeUndefined()
  })

  it('salta las lineas de marca/instrucciones de la plantilla personalizada y encuentra el encabezado real', () => {
    const rows = parseGuestImportRows(buildGuestImportTemplateCsv({ name: 'Fiesta de Sofía', dateLabel: '12 de diciembre de 2026' }) + 'Sofia,Gimenez,342-4496166,,,,,,')

    expect(rows).toEqual([
      {
        first_name: 'Sofia',
        last_name: 'Gimenez',
        email: '',
        phone: '+5493424496166',
        table_assignment: '',
        source_type: '',
        sender_group: '',
        document_number: '',
        companion_names: [],
      },
    ])
  })

  it('la plantilla generica (sin evento) tambien se reimporta sin romperse', () => {
    const rows = parseGuestImportRows(buildGuestImportTemplateCsv() + 'Juan,Perez,,,,,,,')
    expect(rows).toHaveLength(1)
    expect(rows[0].first_name).toBe('Juan')
  })
})
