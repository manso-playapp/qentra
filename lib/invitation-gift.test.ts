import { describe, expect, it } from 'vitest'
import { shouldShowInvitationGift } from '@/components/invitation/InvitationView'

describe('shouldShowInvitationGift', () => {
  it('muestra el regalo cuando el tipo lo permite y el bloque global está visible', () => {
    expect(shouldShowInvitationGift(true, { gift: { visible: true } })).toBe(true)
  })

  it('oculta el regalo cuando el tipo lo desactiva', () => {
    expect(shouldShowInvitationGift(false, { gift: { visible: true } })).toBe(false)
  })

  it('mantiene el límite de la configuración global', () => {
    expect(shouldShowInvitationGift(true, { gift: { visible: false } })).toBe(false)
  })

  it('conserva la compatibilidad para tipos sin configuración guardada', () => {
    expect(shouldShowInvitationGift(undefined, { gift: { visible: true } })).toBe(true)
  })
})
