'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { Check, Pause, Play, ShieldCheck } from 'lucide-react'
import { MarketingBackgroundVideo } from '@/components/marketing/MarketingBackgroundVideo'

const moments = [
  {
    id: 'invitation',
    number: '01',
    label: 'Invitación',
    title: 'La identidad apareció antes que la fecha.',
    detail: 'Dharma tuvo una invitación propia para abrir el recorrido y llevar a cada persona a su experiencia.',
    product: 'Invitación digital personalizada',
  },
  {
    id: 'preparation',
    number: '02',
    label: 'Preparación',
    title: 'Cada respuesta preparó lo que venía después.',
    detail: 'Confirmación, grupo y acceso quedaron conectados antes de que la recepción necesitara usarlos.',
    product: 'Información organizada para la llegada',
  },
  {
    id: 'arrival',
    number: '03',
    label: 'Llegada',
    title: 'Esa noche, el acceso se validó con Alista.',
    detail: 'La captura registra el momento real en que una invitada presentó su QR y recepción verificó el acceso.',
    product: 'Validación real de acceso',
  },
] as const

type MomentId = (typeof moments)[number]['id']

function MomentProduct({ momentId }: { momentId: MomentId }) {
  if (momentId === 'invitation') {
    return (
      <div className="relative min-h-72 overflow-hidden rounded-[1.75rem] bg-[#10100f] sm:min-h-80">
        <Image
          src="/portada.jpg"
          alt="Pieza vertical de la invitación digital de Dharma"
          fill
          sizes="(max-width: 1024px) 88vw, 34vw"
          className="object-contain"
        />
      </div>
    )
  }

  if (momentId === 'preparation') {
    return (
      <div className="flex min-h-72 flex-col justify-between rounded-[1.75rem] bg-[#f0eee8] p-5 text-[#171714] sm:min-h-80 sm:p-6">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Antes de la fiesta</span>
          <span className="size-2 rounded-full bg-[#173b36]" aria-hidden="true" />
        </div>
        <ul className="divide-y divide-black/10">
          {['Invitación enviada', 'Grupo confirmado', 'Acceso preparado'].map((item) => (
            <li key={item} className="flex items-center justify-between gap-4 py-4 text-sm font-bold">
              {item}
              <span className="grid size-6 place-items-center rounded-full bg-[#173b36] text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5 text-black/60">Vista conceptual del producto · sin cifras atribuidas al evento.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-72 overflow-hidden rounded-[1.75rem] bg-[#10100f] sm:min-h-80">
      <Image
        src="/caso-dharma-acceso.png"
        alt="Invitada mostrando su código QR mientras una operadora valida el acceso con Alista"
        fill
        sizes="(max-width: 1024px) 88vw, 34vw"
        className="object-contain"
      />
    </div>
  )
}

export function DharmaCaseStudy() {
  const [selectedMomentId, setSelectedMomentId] = useState<MomentId>('invitation')
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedMoment = moments.find((moment) => moment.id === selectedMomentId) ?? moments[0]

  async function toggleVideo() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play()
      return
    }

    video.pause()
  }

  return (
    <section id="dharma" data-marketing-section="dharma" className="bg-[#c65035] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white">Caso real · Dharma</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white">
              Material real del evento y del producto. Sin testimonios de relleno ni cifras sin fuente.
            </p>
          </div>
          <h2 className="marketing-display text-[clamp(3.4rem,6.75vw,6.75rem)] font-black leading-[0.86] tracking-[-0.01em]">
            Alista ya está pasando.
          </h2>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] bg-[#10100f] sm:min-h-[650px]">
            <MarketingBackgroundVideo
              ref={videoRef}
              className="absolute inset-0 size-full object-cover"
              label="Secuencia audiovisual real de los 15 de Dharma"
              onPlaybackChange={setVideoPlaying}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Material audiovisual real</p>
                <p className="marketing-display mt-2 text-3xl font-black tracking-[-0.01em]">La fiesta, en movimiento.</p>
              </div>
              <button
                type="button"
                onClick={toggleVideo}
                aria-pressed={videoPlaying}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-[#171714] transition hover:bg-[#d9ee73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label={videoPlaying ? 'Pausar video del caso Dharma' : 'Reproducir video del caso Dharma'}
              >
                {videoPlaying ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[2.5rem] bg-[#10100f] p-4 sm:min-h-[650px] sm:p-5">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem]">
              <Image
                src="/caso-dharma-acceso.png"
                alt="Invitada mostrando su código QR mientras una operadora valida el acceso con Alista"
                fill
                sizes="(max-width: 1024px) 90vw, 36vw"
                className="object-contain"
              />
            </div>
            <div className="px-2 pb-2 pt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9ee73]">Producto real · acceso</p>
              <p className="mt-2 text-sm leading-6 text-white">Un QR presentado. Una validación ocurriendo en recepción.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">La secuencia</p>
            <h3 className="marketing-display mt-4 text-5xl font-black leading-[0.92] tracking-[-0.01em]">
              Preparar cambió la llegada.
            </h3>
            <div className="mt-8 space-y-2" role="group" aria-label="Momentos del caso Dharma">
              {moments.map((moment) => {
                const selected = moment.id === selectedMomentId

                return (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => setSelectedMomentId(moment.id)}
                    aria-pressed={selected}
                    className={`grid w-full grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      selected ? 'border-white bg-white text-[#171714]' : 'border-white/16 bg-black/10 text-white hover:border-white/35'
                    }`}
                  >
                    <span className={`marketing-display text-2xl font-black ${selected ? 'text-[#9c3926]' : 'text-white'}`}>
                      {moment.number}
                    </span>
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.18em]">{moment.label}</span>
                      <span className="mt-1 block text-sm font-bold">{moment.product}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 rounded-[2.5rem] bg-[#171714] p-5 sm:p-7 lg:grid-cols-[1fr_0.85fr]" aria-live="polite">
            <div className="flex flex-col justify-between p-1 sm:p-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8b70]">
                  Momento {selectedMoment.number} · {selectedMoment.label}
                </p>
                <h4 className="marketing-display mt-5 text-4xl font-black leading-[0.98] tracking-[-0.01em]">
                  {selectedMoment.title}
                </h4>
                <p className="mt-5 text-sm leading-6 text-white">{selectedMoment.detail}</p>
              </div>
              <p className="mt-10 flex items-center gap-2 text-xs font-bold text-[#d9ee73]">
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                {selectedMoment.product}
              </p>
            </div>
            <MomentProduct momentId={selectedMoment.id} />
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/18 bg-black/10 p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Métricas verificadas</p>
            <p className="marketing-display mt-5 text-4xl font-black tracking-[-0.01em]">Sin cifras publicadas.</p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white">
              Se incorporarán únicamente cuando exista una fuente, una fecha y una definición verificable para cada dato.
            </p>
          </div>
          <div className="rounded-[2rem] bg-[#f0eee8] p-6 text-[#171714] sm:p-8">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
              <ShieldCheck className="size-4 text-[#173b36]" aria-hidden="true" />
              Privacidad y uso
            </p>
            <p className="marketing-display mt-5 text-4xl font-black leading-none tracking-[-0.015em]">Vista local documentada.</p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-black/65">
              El material fue suministrado para esta vista. La publicación final queda sujeta a validar consentimiento, alcance y restricciones de imagen.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
