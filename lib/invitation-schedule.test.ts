import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import InvitationView from '@/components/invitation/InvitationView'
import { buildCalendarUrl, formatInvitationAccessWindow, getInvitationStartDate, getInvitationStartTime } from './invitation-schedule'
import { getEventStartInstant } from './event-date'

const event = { event_date: '2026-10-03', start_time: '21:00', name: 'Fiesta de prueba' }

describe('fecha de llegada del invitado', () => {
  it.each(['travel', 'midnight'] as const)('la plantilla %s presenta el día del acceso y no el inicio general', (template) => {
    const html = renderToStaticMarkup(createElement(InvitationView, {
      event,
      template,
      branding: null,
      guestDisplayName: 'Invitado de prueba',
      schedule: { startTime: '00:00', endTime: '05:00', startDayOffset: 1, endDayOffset: 1 },
      config: { widgets: { particles: false } },
    }))
    expect(html).toContain('Fecha de tu ingreso')
    expect(html).toContain(template === 'travel' ? 'DOM 04 OCTUBRE' : '4 de octubre')
    expect(html).not.toContain(template === 'travel' ? 'SAB 03 OCTUBRE' : '3 de octubre')
    expect(html).toContain('Horario de ingreso: desde el 4 de octubre de 2026 a las 00:00 hs hasta el 4 de octubre de 2026 a las 05:00 hs')
  })

  it('resuelve medianoche al día siguiente también sin offset heredado', () => {
    const schedule = { startTime: '00:00', endTime: '05:00' }
    expect(getInvitationStartDate(event, schedule)).toBe('2026-10-04')
    expect(formatInvitationAccessWindow(event, schedule)).toBe(
      'Horario de ingreso: desde el 4 de octubre de 2026 a las 00:00 hs hasta el 4 de octubre de 2026 a las 05:00 hs'
    )
    expect(getEventStartInstant(getInvitationStartDate(event, schedule)!, getInvitationStartTime(event, schedule)))
      .toBe(Date.parse('2026-10-04T03:00:00Z'))
  })

  it('respeta un día explícito y no interpreta 12:00 como medianoche', () => {
    expect(getInvitationStartDate(event, { startTime: '00:00', startDayOffset: 0 })).toBe('2026-10-03')
    const schedule = { startTime: '12:00', startDayOffset: 1 }
    expect(getInvitationStartTime(event, schedule)).toBe('12:00')
    expect(buildCalendarUrl(event, schedule)).toContain('dates=20261004T120000/20261004T120000')
  })

  it('no traslada la fecha general si el tipo no tiene hora propia', () => {
    expect(getInvitationStartDate(event, { startDayOffset: 1 })).toBe('2026-10-03')
    expect(getInvitationStartTime(event)).toBe('21:00')
  })

  it('muestra ambas fechas en la ventana que cruza medianoche', () => {
    expect(formatInvitationAccessWindow(event, { startTime: '23:00', endTime: '02:00' })).toBe(
      'Horario de ingreso: desde el 3 de octubre de 2026 a las 23:00 hs hasta el 4 de octubre de 2026 a las 02:00 hs'
    )
  })

  it('atraviesa el cambio de año sin cambiar la hora argentina en el calendario', () => {
    const url = new URL(buildCalendarUrl({ ...event, event_date: '2026-12-31' }, { startTime: '00:30' })!)
    expect(url.searchParams.get('dates')).toBe('20270101T003000/20270101T003000')
    expect(url.searchParams.get('ctz')).toBe('America/Argentina/Buenos_Aires')
  })

  it('no convierte el cierre de ingreso en final de fiesta', () => {
    const url = new URL(buildCalendarUrl(event, { startTime: '00:00', endTime: '02:00' })!)
    expect(url.searchParams.get('dates')).toBe('20261004T000000/20261004T000000')
    expect(url.searchParams.get('details')).toContain('hasta el 4 de octubre de 2026 a las 02:00 hs')
    expect(url.searchParams.get('details')).toContain('La hora de finalización de la fiesta no está indicada')
  })

  it('no fabrica calendario con fecha u hora inválida o faltante', () => {
    expect(buildCalendarUrl({ event_date: '2026-02-30', start_time: '21:00' })).toBeNull()
    expect(buildCalendarUrl({ event_date: '2026-10-03', start_time: '25:00' })).toBeNull()
    expect(buildCalendarUrl({ event_date: '2026-10-03' })).toBeNull()
  })
})
