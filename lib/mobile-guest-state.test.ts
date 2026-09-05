import { describe, expect, it } from 'vitest'
import { mobileGuestState } from './mobile-guest-state'
import type { GuestWithType, InvitationDeliveryTracking, InvitationToken } from '@/types'
const guest = { status: 'pending', db_status: 'link_sent', payment_status: 'not_required' } as GuestWithType
const token = { id: 'token' } as InvitationToken

describe('seguimiento móvil: envío, respuesta y pago separados', () => {
  it('un link generado no prueba envío ni respuesta', () => {
    expect(mobileGuestState(guest, token)).toMatchObject({ unmarked: true, needsReply: true, delivery: 'Sin registro de envío' })
  })
  it('sin token no lo incluye entre enlaces sin marcar', () => {
    expect(mobileGuestState(guest)).toMatchObject({ unmarked: false, delivery: 'Sin invitación generada' })
  })
  it('el marcado manual no confirma asistencia', () => {
    expect(mobileGuestState(guest, token, { status: 'marked_sent' } as InvitationDeliveryTracking)).toMatchObject({ unmarked: false, needsReply: true, delivery: 'Marcada como enviada' })
  })
  it('una visita no se presenta como envío comprobado', () => {
    expect(mobileGuestState(guest, token, { first_opened_at: '2026-09-05' } as InvitationDeliveryTracking)).toMatchObject({ needsReply: true, unmarked: false, delivery: 'Invitación visitada' })
  })
  it('respuesta y pago pendiente pueden coexistir', () => {
    expect(mobileGuestState({ ...guest, status: 'confirmed', db_status: 'registered', payment_status: 'pending' }, token)).toMatchObject({ responded: true, needsReply: false, needsPayment: true, unmarked: false })
  })
  it('el texto en notes no cambia el pago', () => {
    expect(mobileGuestState({ ...guest, payment_status: 'pending', special_requests: 'Pago: approved' }, token).needsPayment).toBe(true)
  })
  it.each(['rejected', 'duplicate'] as const)('no persigue respuesta o pago de un grupo %s', db_status => {
    expect(mobileGuestState({ ...guest, db_status, payment_status: 'pending' }, token)).toMatchObject({ needsReply: false, needsPayment: false, unmarked: false })
  })
})
