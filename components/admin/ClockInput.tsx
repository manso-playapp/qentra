'use client'

import { useId } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  id?: string
  name?: string
  required?: boolean
  className?: string
  'aria-label'?: string
}

const hours = Array.from({ length: 24 }, (_, n) => String(n).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, n) => String(n).padStart(2, '0'))

/** Native time inputs can display 12h depending on the device locale. */
export function ClockInput({ value, onChange, id, name, required, className, 'aria-label': label = 'Horario' }: Props) {
  const generatedId = useId()
  const controlId = id || generatedId
  const [hour = '', minute = ''] = value.split(':')
  const selectClass = 'min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <select id={controlId} aria-label={`${label}: hora (24 horas)`} required={required} value={hour} className={selectClass} onChange={(e) => onChange(e.target.value ? `${e.target.value}:${minute || '00'}` : '')}>
          <option value="">Hora</option>
          {hours.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span aria-hidden="true">:</span>
        <select aria-label={`${label}: minutos`} required={required} value={minute} className={selectClass} onChange={(e) => onChange(e.target.value ? `${hour || '00'}:${e.target.value}` : '')}>
          <option value="">Min.</option>
          {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {name && <input type="hidden" name={name} value={value} />}
      </div>
      {hour === '00' && minute === '00' && <p className="mt-1 text-xs text-gray-600">00:00 · Medianoche, al comenzar esta fecha.</p>}
      {hour === '12' && minute === '00' && <p className="mt-1 text-xs text-gray-600">12:00 · Mediodía.</p>}
    </div>
  )
}
