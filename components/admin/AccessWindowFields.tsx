'use client'

import { useId } from 'react'
import { ClockInput } from '@/components/admin/ClockInput'
import { formatEventDate } from '@/lib/event-date'
import { dateAtOffset, dayOffsetForDate, validateAccessSchedule } from '@/lib/event-schedule'
import { formatGuestTypeAccessPolicy } from '@/lib/access-policy'

type WindowFields = {
  access_start_time: string
  access_end_time: string
  access_start_day_offset: string
  access_end_day_offset: string
}

export function AccessWindowFields({ value, eventDate, eventStartTime, onChange }: {
  value: WindowFields
  eventDate: string
  eventStartTime: string
  onChange: (field: keyof WindowFields, value: string) => void
}) {
  const id = useId()
  const schedule = { ...value, access_start_day_offset: Number(value.access_start_day_offset), access_end_day_offset: Number(value.access_end_day_offset) }
  const error = validateAccessSchedule(schedule, eventStartTime)
  return (
    <fieldset className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-gray-900">Fechas y horas de ingreso</legend>
      <p className="text-xs leading-5 text-gray-600">La fiesta empieza el {formatEventDate(eventDate, { weekday: 'long', day: 'numeric', month: 'long' })}. Después de medianoche elegí la fecha del día siguiente. Horas de 00 a 23, en Argentina.</p>
      {(['start', 'end'] as const).map((boundary) => {
        const timeField = `access_${boundary}_time` as const
        const dayField = `access_${boundary}_day_offset` as const
        const date = dateAtOffset(eventDate, Number(value[dayField]))
        const label = boundary === 'start' ? 'Ingreso desde' : 'Ingreso hasta'
        return <div key={boundary} className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${id}-${boundary}-date`} className="block text-sm font-medium text-gray-700">{label}: fecha</label>
            <input id={`${id}-${boundary}-date`} type="date" required={Boolean(value[timeField])} min={eventDate} max={dateAtOffset(eventDate, 365)} value={date} onChange={(e) => {
              const offset = dayOffsetForDate(eventDate, e.target.value)
              if (offset !== null) onChange(dayField, String(offset))
            }} className="mt-1 block w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm" />
            <p className="mt-1 text-xs leading-5 text-gray-600">{formatEventDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="min-w-0">
            <label htmlFor={`${id}-${boundary}-time`} className="block text-sm font-medium text-gray-700">{label}: hora</label>
            <ClockInput id={`${id}-${boundary}-time`} aria-label={label} value={value[timeField]} onChange={(time) => onChange(timeField, time)} className="mt-1" />
          </div>
        </div>
      })}
      <p className="text-xs leading-5 text-gray-600">Cada extremo sin hora queda sin restricción. El cierre de ingreso no indica cuándo termina la fiesta.</p>
      <p aria-live="polite" className={`rounded-md p-3 text-sm leading-6 ${error ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-700'}`}>{error || formatGuestTypeAccessPolicy(schedule, eventStartTime, eventDate)}</p>
    </fieldset>
  )
}
