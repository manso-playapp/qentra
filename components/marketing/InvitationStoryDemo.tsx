'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, QrCode, RotateCcw } from 'lucide-react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

type DemoStage = 'invitation' | 'rsvp' | 'prepared'
type MemberId = 'maria' | 'tomas' | 'juana'
type Attendance = Record<MemberId, boolean>

const family = [
  { id: 'maria', name: 'María' },
  { id: 'tomas', name: 'Tomás' },
  { id: 'juana', name: 'Juana' },
] as const

const initialAttendance: Attendance = {
  maria: true,
  tomas: true,
  juana: true,
}

export function InvitationStoryDemo() {
  const [stage, setStage] = useState<DemoStage>('invitation')
  const [attendance, setAttendance] = useState<Attendance>({ ...initialAttendance })
  const [vegetarianMenu, setVegetarianMenu] = useState(true)
  const stageHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousStageRef = useRef<DemoStage>(stage)

  const confirmedMembers = family.filter((member) => attendance[member.id])
  const confirmedCount = confirmedMembers.length
  const vegetarianMenuConfirmed = attendance.juana && vegetarianMenu

  useEffect(() => {
    if (previousStageRef.current === stage) return

    stageHeadingRef.current?.focus()
    previousStageRef.current = stage
  }, [stage])

  function toggleAttendance(memberId: MemberId) {
    setAttendance((current) => ({
      ...current,
      [memberId]: !current[memberId],
    }))
  }

  function resetDemo() {
    setAttendance({ ...initialAttendance })
    setVegetarianMenu(true)
    setStage('invitation')
  }

  function startDemo() {
    trackMarketingEvent('invitation_demo_started', {})
    setStage('rsvp')
  }

  function completeDemo() {
    if (confirmedCount < 1 || confirmedCount > 3) return

    trackMarketingEvent('invitation_demo_completed', {
      attendee_count: confirmedCount as 1 | 2 | 3,
      restriction_selected: vegetarianMenuConfirmed,
    })
    setStage('prepared')
  }

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="overflow-hidden rounded-[2.25rem] border border-white/15 bg-[#f4efe6] text-[#171714] shadow-[0_32px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/55">
          <span>Alista</span>
          <span>Dharma · 15</span>
        </div>

        <div className="min-h-[550px] p-5 sm:p-7">
          {stage === 'invitation' ? (
            <div className="flex min-h-[490px] flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9d3524]">
                  12 · 09 · 2026
                </p>
                <h3
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="marketing-display mt-8 text-[3.4rem] font-black leading-[0.86] tracking-[-0.025em] focus:outline-none"
                >
                  Dharma
                  <br />
                  te invita
                  <br />
                  a sus 15.
                </h3>
                <p className="mt-7 max-w-[16rem] text-sm leading-6 text-black/60">
                  Una noche para encontrarnos, bailar y viajar juntos.
                </p>
              </div>
              <button
                type="button"
                onClick={startDemo}
                className="flex min-h-12 w-full items-center justify-between rounded-full bg-[#171714] px-5 text-sm font-bold text-white transition hover:bg-[#d75437] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d75437] focus-visible:ring-offset-2"
              >
                Abrir invitación
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {stage === 'rsvp' ? (
            <div className="flex min-h-[490px] flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9d3524]">
                Confirmación
              </p>
              <h3
                ref={stageHeadingRef}
                tabIndex={-1}
                className="marketing-display mt-5 text-4xl font-black leading-none tracking-[-0.01em] focus:outline-none"
              >
                ¿Quiénes vienen?
              </h3>
              <p className="mt-3 text-sm leading-6 text-black/55">
                Invitación para Familia Pérez.
              </p>

              <fieldset className="mt-7 space-y-2">
                <legend className="sr-only">Elegir integrantes que asistirán</legend>
                {family.map((member) => {
                  const attending = attendance[member.id]

                  return (
                    <label
                      key={member.id}
                      className={`flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black has-[:focus-visible]:ring-offset-2 ${
                        attending
                          ? 'border-black/10 bg-white/75'
                          : 'border-black/10 bg-transparent text-black/45'
                      }`}
                    >
                      <span className="text-sm font-bold">{member.name} Pérez</span>
                      <input
                        type="checkbox"
                        checked={attending}
                        onChange={() => toggleAttendance(member.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`grid size-7 place-items-center rounded-full border transition ${
                          attending
                            ? 'border-[#171714] bg-[#171714] text-white'
                            : 'border-black/20 text-transparent'
                        }`}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              <label
                className={`mt-4 flex min-h-14 items-center justify-between gap-4 rounded-2xl px-4 py-3 transition ${
                  attendance.juana ? 'cursor-pointer bg-[#e7ded0]' : 'bg-black/5 text-black/35'
                }`}
              >
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
                    Necesidad alimentaria
                  </span>
                  <span className="mt-1 block text-sm font-semibold">Menú vegetariano para Juana</span>
                </span>
                <input
                  type="checkbox"
                  checked={vegetarianMenuConfirmed}
                  disabled={!attendance.juana}
                  onChange={(event) => setVegetarianMenu(event.target.checked)}
                  className="size-5 accent-[#d75437]"
                />
              </label>

              <button
                type="button"
                disabled={confirmedCount === 0}
                onClick={completeDemo}
                className="mt-auto flex min-h-12 w-full items-center justify-between rounded-full bg-[#d75437] px-5 text-sm font-bold text-white transition hover:bg-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d75437] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/35"
              >
                {confirmedCount === 0
                  ? 'Elegí al menos una persona'
                  : `Confirmar ${confirmedCount} ${confirmedCount === 1 ? 'persona' : 'personas'}`}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {stage === 'prepared' ? (
            <div className="flex min-h-[490px] flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9d3524]">
                  Del otro lado
                </p>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="grid size-9 place-items-center rounded-full border border-black/10 text-black/55 transition hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  aria-label="Reiniciar demostración"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-7 border-b border-black/10 pb-5">
                <p className="text-xs text-black/45">Grupo de invitación</p>
                <h3
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="marketing-display mt-1 text-4xl font-black tracking-[-0.015em] focus:outline-none"
                >
                  Familia Pérez
                </h3>
                <p className="mt-2 text-xs leading-5 text-black/50">
                  {confirmedMembers.map((member) => member.name).join(', ')}
                </p>
              </div>

              <dl className="divide-y divide-black/10">
                {[
                  ['Confirmados', `${confirmedCount} ${confirmedCount === 1 ? 'persona' : 'personas'}`],
                  ['Acceso', 'Cena'],
                  ['Restricciones', vegetarianMenuConfirmed ? '1 vegetariano' : 'Ninguna'],
                  ['Invitación', 'Enviada'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-sm text-black/50">{label}</dt>
                    <dd className="text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto flex items-center gap-4 rounded-2xl bg-[#171714] p-4 text-white">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-[#171714]">
                  <QrCode className="size-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold">Acceso familiar listo</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Un QR para recibir al grupo.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-white/50">
        Demo interactiva · no guarda datos ni modifica un evento real.
      </p>
    </div>
  )
}
