import { describe, expect, it } from 'vitest'
import { toE164 } from '@/lib/access-delivery'

describe('toE164', () => {
  it('agrega +549 a un movil argentino sin codigo de pais', () => {
    // El caso que fallaba: Twilio lo tomaba como +1 (EE.UU.).
    expect(toE164('3425579221')).toBe('+5493425579221')
  })

  it('respeta un numero que ya viene en E.164', () => {
    expect(toE164('+5493425025562')).toBe('+5493425025562')
  })

  it('saca el prefijo 0 de larga distancia', () => {
    expect(toE164('03425579221')).toBe('+5493425579221')
  })

  it('convierte 00 inicial en +', () => {
    expect(toE164('005493425579221')).toBe('+5493425579221')
  })

  it('agrega + a un numero que empieza con 54', () => {
    expect(toE164('5493425579221')).toBe('+5493425579221')
  })

  it('agrega solo +54 si ya trae el 9 de movil', () => {
    expect(toE164('93425579221')).toBe('+5493425579221')
  })

  it('limpia espacios, guiones y parentesis', () => {
    expect(toE164('+54 9 (342) 557-9221')).toBe('+5493425579221')
  })
})
