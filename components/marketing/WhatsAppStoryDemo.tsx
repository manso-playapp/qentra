'use client'

import { useState } from 'react'
import { ArrowRight, ArrowUpRight, MessageCircle, PencilLine } from 'lucide-react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

const defaultMessage =
  'Martu, te invito a mis 15 ✨ Te dejo tu invitación para que confirmes.'

export function WhatsAppStoryDemo() {
  const [view, setView] = useState<'compose' | 'received'>('compose')
  const [message, setMessage] = useState(defaultMessage)
  const visibleMessage = message.trim() || defaultMessage

  function togglePreview() {
    if (view === 'compose') {
      trackMarketingEvent('whatsapp_demo_previewed', {
        customized: message !== defaultMessage,
      })
    }

    setView((current) => (current === 'compose' ? 'received' : 'compose'))
  }

  return (
    <div className="rounded-[2.5rem] bg-[#0f1814] p-5 text-white shadow-[0_30px_80px_rgba(23,23,20,0.18)] sm:p-8">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="grid size-11 place-items-center rounded-full bg-[#ff8b70] font-black text-black">E</span>
        <div>
          <p className="text-sm font-bold">Emilia</p>
          <p className="text-xs text-white/65">Ejemplo ficticio · WhatsApp personal</p>
        </div>
        <span className="ml-auto rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
          {view === 'compose' ? 'Prepara' : 'Martina recibe'}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/65" aria-hidden="true">
        <span className={view === 'compose' ? 'text-[#d9ee73]' : undefined}>1 · Emilia</span>
        <ArrowRight className="size-3" />
        <span className={view === 'received' ? 'text-[#d9ee73]' : undefined}>2 · Martina</span>
        <ArrowRight className="size-3" />
        <span>Alista</span>
      </div>

      <div className="min-h-[340px]" aria-live="polite">
        {view === 'compose' ? (
          <div className="mt-7">
            <label htmlFor="whatsapp-demo-message" className="flex items-center gap-2 text-xs font-bold text-white/60">
              <PencilLine className="size-3.5" aria-hidden="true" />
              Mensaje editable antes de enviar
            </label>
            <textarea
              id="whatsapp-demo-message"
              value={message}
              maxLength={180}
              rows={5}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-3 w-full resize-none rounded-3xl border border-white/10 bg-white/7 p-4 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#d9ee73] focus:ring-2 focus:ring-[#d9ee73]/30"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-white/65">
              <span>Emilia envía desde su WhatsApp.</span>
              <span>{message.length}/180</span>
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9ee73]">Alista prepara</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Texto y link personal. Madre e hija pueden invitar a sus propios contactos desde sus teléfonos.</p>
            </div>
          </div>
        ) : (
          <div className="pt-7">
            <div className="ml-auto max-w-[92%] rounded-[1.5rem_1.5rem_0.35rem_1.5rem] bg-[#d9ee73] p-4 text-[#171714]">
              <p className="text-sm font-semibold leading-6">{visibleMessage}</p>
              <div className="mt-4 overflow-hidden rounded-2xl bg-[#f0eee8] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/65">Alista · Invitación personal</p>
                <p className="marketing-display mt-2 text-2xl font-black tracking-[-0.01em]">Emilia te invita.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black">
                  Abrir invitación
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/65">
              <MessageCircle className="size-4" aria-hidden="true" />
              La invitación llega de alguien conocido, con el diseño que preparamos para la fiesta.
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={togglePreview}
        className="mt-6 flex min-h-12 w-full items-center justify-between rounded-full bg-white px-5 text-sm font-black text-[#171714] transition hover:bg-[#ff8b70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9ee73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1814]"
      >
        {view === 'compose' ? 'Ver como lo recibe Martina' : 'Volver a editar'}
        <ArrowRight className={`size-4 transition-transform motion-reduce:transition-none ${view === 'received' ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <p className="mt-4 text-xs leading-5 text-white/65">Demostración ilustrativa. Este botón no envía mensajes ni abre WhatsApp.</p>
    </div>
  )
}
