'use client'

import Image from 'next/image'
import { useState } from 'react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

const personas = [
  {
    id: 'martina',
    selector: 'Martina · Colegio',
    name: 'Martina',
    eyebrow: 'Trasnoche',
    title: 'Martina, te esperamos a las 00:30.',
    detail: 'Tu invitación es para el trasnoche. Encontrá el lugar y el horario antes de salir.',
    context: 'Preparamos el mensaje del tipo de acceso para que Martina sepa a qué momento de la fiesta está invitada.',
  },
  {
    id: 'familia',
    selector: 'Familia Pérez · Cena',
    name: 'Familia Pérez',
    eyebrow: 'Cena',
    title: 'Llegan juntos. Entran juntos.',
    detail: 'Confirmen quiénes vienen y completen los nombres de sus acompañantes.',
    context: 'Revisamos los datos del grupo antes de la fiesta y acordamos qué información necesita el salón.',
  },
  {
    id: 'tomas',
    selector: 'Tomás · Entrada',
    name: 'Tomás',
    eyebrow: 'Trasnoche con entrada',
    title: 'Tu entrada está lista.',
    detail: 'Pago confirmado. Presentá tu QR al personal de recepción.',
    context: 'Este ejemplo muestra una invitación con entrada paga. El pago queda asociado al grupo y la responsable recibe el cobro.',
  },
] as const

const universes = [
  {
    id: 'editorial',
    label: 'Editorial oscuro',
    swatch: 'bg-[#ff8b70]',
    background: 'bg-[#181818] text-white',
    accent: 'text-[#ff8b70]',
    panel: 'bg-[#f0eee8] text-[#181818]',
    title: 'marketing-display font-black tracking-[-0.02em]',
  },
  {
    id: 'soft',
    label: 'Suave y luminoso',
    swatch: 'bg-[#9b4965]',
    background: 'bg-[#f7e9e4] text-[#321820]',
    accent: 'text-[#9b4965]',
    panel: 'bg-white/75 text-[#321820] border border-[#9b4965]/15',
    title: 'font-sans font-extrabold tracking-[-0.01em]',
  },
  {
    id: 'pop',
    label: 'Color y energía',
    swatch: 'bg-[#d9ee73]',
    background: 'bg-[#213480] text-white',
    accent: 'text-[#d9ee73]',
    panel: 'bg-[#d9ee73] text-[#171714]',
    title: 'marketing-display font-black uppercase tracking-[0.005em]',
  },
] as const

type UniverseId = (typeof universes)[number]['id']

function UniverseMedia({ universeId }: { universeId: UniverseId }) {
  if (universeId === 'editorial') {
    return (
      <div className="absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden sm:block" aria-hidden="true">
        <Image
          src="/portada.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 38vw, 25vw"
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-[#181818]/25" />
      </div>
    )
  }

  if (universeId === 'soft') {
    return (
      <div className="absolute right-6 top-6 hidden border-y border-[#9b4965]/20 py-4 text-right sm:block" aria-hidden="true">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9b4965]/60">Septiembre</p>
        <p className="marketing-display mt-1 text-5xl font-black tracking-[-0.02em] text-[#9b4965]/25">12—09</p>
      </div>
    )
  }

  return (
    <div className="marketing-display absolute -right-3 -top-9 text-[12rem] font-black leading-none tracking-[-0.04em] text-white/7 sm:text-[16rem]" aria-hidden="true">
      15
    </div>
  )
}

export function PersonaPreview() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<(typeof personas)[number]['id']>('martina')
  const [selectedUniverseId, setSelectedUniverseId] = useState<UniverseId>('editorial')
  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0]
  const selectedUniverse = universes.find((universe) => universe.id === selectedUniverseId) ?? universes[0]

  function selectPersona(personaId: (typeof personas)[number]['id']) {
    const analyticsPersona = {
      martina: 'student',
      familia: 'family',
      tomas: 'paid_entry',
    } as const

    setSelectedPersonaId(personaId)
    trackMarketingEvent('persona_preview_changed', {
      persona: analyticsPersona[personaId],
    })
  }

  function selectUniverse(universeId: UniverseId) {
    setSelectedUniverseId(universeId)
    trackMarketingEvent('visual_style_changed', { style: universeId })
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-black/65">Ver como…</legend>
          <div className="flex flex-col gap-2">
            {personas.map((persona) => {
              const active = selectedPersonaId === persona.id

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => selectPersona(persona.id)}
                  aria-pressed={active}
                  className={`min-h-14 rounded-full border px-5 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-black/15 bg-white/50 text-black hover:border-black/40'
                  }`}
                >
                  {persona.selector}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-black/65">Explorá un estilo</legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {universes.map((universe) => {
              const active = selectedUniverseId === universe.id

              return (
                <button
                  key={universe.id}
                  type="button"
                  onClick={() => selectUniverse(universe.id)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    active ? 'border-black bg-white text-black' : 'border-black/10 bg-transparent text-black/65 hover:border-black/30'
                  }`}
                >
                  <span className={`size-3 rounded-full ${universe.swatch}`} aria-hidden="true" />
                  {universe.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div
        className={`${selectedUniverse.background} relative min-h-[540px] overflow-hidden rounded-[2.5rem] p-5 transition-colors duration-500 motion-reduce:transition-none sm:p-8`}
        aria-live="polite"
      >
        <UniverseMedia universeId={selectedUniverse.id} />

        <div className="relative z-10 flex min-h-[476px] flex-col justify-between">
          <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-55">
            <span>Diseño ilustrativo · datos ficticios</span>
            <span>{selectedPersona.name}</span>
          </div>

          <div className={selectedUniverse.id === 'editorial' ? 'sm:max-w-[64%]' : 'max-w-2xl'}>
            <p className={`${selectedUniverse.accent} text-xs font-bold uppercase tracking-[0.2em]`}>
              {selectedPersona.eyebrow}
            </p>
            <h3 className={`${selectedUniverse.title} mt-4 text-4xl leading-[0.98] sm:text-5xl`}>
              {selectedPersona.title}
            </h3>
            <div className={`${selectedUniverse.panel} mt-7 max-w-lg rounded-3xl p-5 transition-colors duration-500 motion-reduce:transition-none`}>
              <p className="text-sm font-semibold leading-6">{selectedPersona.detail}</p>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-5 opacity-50">{selectedPersona.context}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
