import { describe, expect, it } from 'vitest'
import { parseGuestImportRows } from '@/lib/guest-import'

describe('parseGuestImportRows', () => {
  it('interpreta nombre completo, tipo y destino de una planilla de invitados', () => {
    const rows = parseGuestImportRows(
      ',,,,\n,NOMBRE,TELEFONO,DESTINO,TIPO\n1,Julieta Petrone,3496-511642,imperial,cena\n2,Caterina Gemin,SIN INGRESO,,cena'
    )

    expect(rows).toEqual([
      {
        first_name: 'Julieta',
        last_name: 'Petrone',
        email: '',
        phone: '+5493496511642',
        table_assignment: 'imperial',
        source_type: 'cena',
      },
      {
        first_name: 'Caterina',
        last_name: 'Gemin',
        email: '',
        phone: '',
        table_assignment: '',
        source_type: 'cena',
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
      },
    ])
  })
})
