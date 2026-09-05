import { describe, expect, it } from 'vitest'
import { dateAtOffset, dayOffsetForDate, formatEventSchedule, getEventScheduleEndDate, resolveAccessDayOffset, validateAccessSchedule } from './event-schedule'
import { formatGuestTypeAccessPolicy } from './access-policy'

const event = { event_date: '2026-10-03', start_time: '20:30' }
const dinner = { access_start_time: '20:30:00', access_start_day_offset: 0, access_end_time: '04:00:00', access_end_day_offset: 1 }
const late = { access_start_time: '00:00', access_start_day_offset: 1, access_end_time: '05:00', access_end_day_offset: 1 }

describe('fechas de una fiesta que cruza medianoche', () => {
  it('muestra cada fecha real del 3 al 4 de octubre y horas de 24h', () => {
    const result = formatGuestTypeAccessPolicy(dinner, event.start_time, event.event_date)
    expect(result).toContain('sábado, 3 de octubre de 2026 a las 20:30')
    expect(result).toContain('domingo, 4 de octubre de 2026 a las 04:00')
    expect(result).not.toContain('+1')
    expect(formatGuestTypeAccessPolicy(late, event.start_time, event.event_date)).toContain('4 de octubre de 2026 a las 00:00')
  })
  it('conserva la inferencia de fechas antiguas sin sustituir offsets explícitos', () => {
    expect(resolveAccessDayOffset('00:00', '20:30', null)).toBe(1)
    expect(resolveAccessDayOffset('00:00', '20:30', 0)).toBe(0)
    expect(resolveAccessDayOffset('20:30:00', '20:30', null)).toBe(0)
  })
  it('resuelve cambio de mes, año y año bisiesto sin timezone local', () => {
    expect(dateAtOffset('2026-12-31', 1)).toBe('2027-01-01')
    expect(dateAtOffset('2028-02-28', 1)).toBe('2028-02-29')
    expect(dateAtOffset('2026-02-28', 1)).toBe('2026-03-01')
    expect(dayOffsetForDate('2026-12-31', '2027-01-01')).toBe(1)
    expect(dateAtOffset('2026-02-30', 1)).toBe('')
  })
  it('no incluye tipos inactivos ni inventa un fin global', () => {
    expect(getEventScheduleEndDate(event, [dinner, late])).toBe('2026-10-04')
    expect(getEventScheduleEndDate(event, [{ ...late, is_active: false }])).toBe('2026-10-03')
    expect(formatEventSchedule(event)).not.toContain('hasta')
    expect(formatEventSchedule(event, [dinner])).toContain('Accesos hasta: domingo, 4 de octubre')
    expect(formatEventSchedule(event, [dinner], { compact: true })).toContain('3–4 oct 2026')
    expect(formatEventSchedule(event, [dinner], { compact: true })).toContain('inicio 20:30')
  })
})

describe('validación del intervalo de ingreso', () => {
  it('acepta cena, medianoche y restricciones parciales', () => {
    for (const schedule of [dinner, late, {}, { access_start_time: '23:00' }, { access_end_time: '05:00' }, { ...dinner, access_end_day_offset: null }]) {
      expect(validateAccessSchedule(schedule, event.start_time)).toBeNull()
    }
  })
  it('rechaza mediodía después del cierre y extremos iguales', () => {
    expect(validateAccessSchedule({ ...late, access_start_time: '12:00' }, event.start_time)).toContain('posterior')
    expect(validateAccessSchedule({ ...late, access_start_time: '05:00' }, event.start_time)).toContain('posterior')
    expect(validateAccessSchedule({ ...dinner, access_end_day_offset: 0 }, event.start_time)).toContain('posterior')
  })
  it.each(['24:00', '12:60', '00:00 AM', '9:00', '20:30:99'])('rechaza reloj inválido %s', (clock) => {
    expect(validateAccessSchedule({ access_start_time: clock })).toContain('00:00')
  })
  it.each([-1, 0.5, 366, NaN])('rechaza fecha desplazada inválida %s', (offset) => {
    expect(validateAccessSchedule({ access_start_day_offset: offset })).toContain('fecha')
  })
})
