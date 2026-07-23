'use client'

import { Music2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

const PARTY_TRACK_URL = '/Party.mp3'

/**
 * El audio propio evita las vistas previas de proveedores externos. El primer
 * intento ocurre al abrir la invitacion; si el navegador lo bloquea, cualquier
 * toque sobre la pagina lo inicia sin requerir un boton de Play.
 */
export default function InvitationMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const startPlayback = () => {
      void audioRef.current?.play().catch(() => {
        // El navegador puede exigir una interaccion. El siguiente toque reintenta.
      })
    }

    startPlayback()
    document.addEventListener('pointerdown', startPlayback, { capture: true, once: true })
    document.addEventListener('keydown', startPlayback, { capture: true, once: true })

    return () => {
      document.removeEventListener('pointerdown', startPlayback, { capture: true })
      document.removeEventListener('keydown', startPlayback, { capture: true })
    }
  }, [])

  return (
    <>
      <div className="mt-2 flex items-center gap-3 rounded-[18px] bg-slate-950 px-4 py-3 text-white">
        <Music2 className="size-4 shrink-0 text-[#fcb39e]" aria-hidden="true" />
        <p className="text-sm font-semibold">Party In The U.S.A. · Miley Cyrus</p>
      </div>
      <audio ref={audioRef} src={PARTY_TRACK_URL} autoPlay preload="auto" />
    </>
  )
}
