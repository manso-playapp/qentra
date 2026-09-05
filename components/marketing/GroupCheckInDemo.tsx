'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, QrCode, RotateCcw, ScanLine, Users } from 'lucide-react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

type CheckInStage = 'scan' | 'group' | 'admitted'

const familyMembers = ['María', 'Tomás', 'Juana'] as const

export function GroupCheckInDemo() {
  const [stage, setStage] = useState<CheckInStage>('scan')
  const stageHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousStageRef = useRef<CheckInStage>(stage)

  useEffect(() => {
    if (previousStageRef.current === stage) return

    stageHeadingRef.current?.focus()
    previousStageRef.current = stage
  }, [stage])

  function resetDemo() {
    setStage('scan')
  }

  function startDemo() {
    trackMarketingEvent('checkin_demo_started', {})
    setStage('group')
  }

  function completeDemo() {
    trackMarketingEvent('checkin_demo_completed', { group_size: 3 })
    setStage('admitted')
  }

  return (
    <div className="mx-auto w-full max-w-[470px]">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#171714] text-white shadow-[0_30px_80px_rgba(23,23,20,0.18)]">
        <div className="flex items-center justify-between border-b border-white/12 px-5 py-4 sm:px-7">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
            Alista · recepción demo
          </span>
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            <span
              className={`size-2 rounded-full ${stage === 'admitted' ? 'bg-[#d9ee73]' : 'bg-[#ff8b70]'}`}
              aria-hidden="true"
            />
            {stage === 'scan' ? 'Esperando acceso' : stage === 'group' ? 'Entrada válida' : 'Ingreso registrado'}
          </span>
        </div>

        <div className="min-h-[520px] p-5 sm:p-7">
          {stage === 'scan' ? (
            <div className="flex min-h-[466px] flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8b70]">Check-in</p>
                  <h3
                    ref={stageHeadingRef}
                    tabIndex={-1}
                    className="marketing-display mt-3 text-4xl font-black leading-[0.98] tracking-[-0.01em] focus:outline-none"
                  >
                    Listo para escanear.
                  </h3>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/5 text-white/65">
                  <QrCode className="size-5" aria-hidden="true" />
                </span>
              </div>

              <div className="relative my-auto grid min-h-56 place-items-center overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04]">
                <span className="absolute left-7 top-7 size-8 border-l-2 border-t-2 border-[#d9ee73]" aria-hidden="true" />
                <span className="absolute right-7 top-7 size-8 border-r-2 border-t-2 border-[#d9ee73]" aria-hidden="true" />
                <span className="absolute bottom-7 left-7 size-8 border-b-2 border-l-2 border-[#d9ee73]" aria-hidden="true" />
                <span className="absolute bottom-7 right-7 size-8 border-b-2 border-r-2 border-[#d9ee73]" aria-hidden="true" />
                <div className="text-center text-white/65">
                  <ScanLine className="mx-auto size-9" strokeWidth={1.5} aria-hidden="true" />
                  <p className="mt-3 text-xs font-bold">Acercá el acceso del grupo</p>
                </div>
                <span className="absolute inset-x-10 top-1/2 h-px bg-[#ff8b70] shadow-[0_0_14px_rgba(255,139,112,0.8)] motion-safe:animate-pulse" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={startDemo}
                className="flex min-h-13 w-full items-center justify-between rounded-full bg-[#ff8b70] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171714]"
              >
                Escanear acceso demo
                <ScanLine className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {stage === 'group' ? (
            <div className="flex min-h-[466px] flex-col">
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d9ee73]">
                  <span className="grid size-6 place-items-center rounded-full bg-[#d9ee73] text-[#171714]">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  Entrada válida
                </p>
                <span className="rounded-full border border-white/12 px-3 py-1 text-[10px] font-bold text-white/65">
                  Cena
                </span>
              </div>

              <div className="mt-8">
                <p className="text-xs text-white/65">Grupo encontrado</p>
                <h3
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="marketing-display mt-2 text-4xl font-black leading-none tracking-[-0.01em] focus:outline-none"
                >
                  Familia Pérez
                </h3>
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/70">
                  <Users className="size-4" aria-hidden="true" />
                  3 personas · un acceso
                </p>
              </div>

              <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {familyMembers.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-4 py-3.5">
                    <span className="text-sm font-bold">{name} Pérez</span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9ee73]">
                      Listo
                      <span className="grid size-5 place-items-center rounded-full bg-[#d9ee73] text-[#171714]">
                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={completeDemo}
                className="mt-auto flex min-h-13 w-full items-center justify-between rounded-full bg-[#ff8b70] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171714]"
              >
                Ingresan los 3
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {stage === 'admitted' ? (
            <div className="flex min-h-[466px] flex-col text-center">
              <button
                type="button"
                onClick={resetDemo}
                className="ml-auto grid size-10 place-items-center rounded-full border border-white/12 text-white/55 transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Reiniciar demostración de ingreso"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>

              <div className="my-auto">
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#d9ee73] text-[#171714] shadow-[0_0_0_12px_rgba(217,238,115,0.1)]">
                  <Check className="size-9" strokeWidth={3} aria-hidden="true" />
                </span>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#d9ee73]">
                  Ingreso registrado
                </p>
                <h3
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="marketing-display mt-3 text-5xl font-black leading-none tracking-[-0.01em] focus:outline-none"
                >
                  Entraron los 3.
                </h3>
                <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-white/70">
                  El grupo quedó registrado completo. Recepción confirma el paso desde el celular, sin esperar al recibidor.
                </p>
              </div>

              <button
                type="button"
                onClick={resetDemo}
                className="min-h-12 w-full rounded-full border border-white/18 px-6 text-sm font-bold text-white transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Probar de nuevo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-black/60">
        Ejemplo ficticio de ingreso del grupo completo. No registra accesos reales ni muestra llegadas por separado.
      </p>
    </div>
  )
}
