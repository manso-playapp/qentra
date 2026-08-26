'use client'

import { Music2, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function InvitationMusicPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const startPlayback = () => {
      void audio.play().then(() => setIsPlaying(true)).catch(() => {
        // El navegador puede exigir una interacción antes de habilitar audio.
      })
    }
    const markPlaying = () => setIsPlaying(true)
    const markPaused = () => setIsPlaying(false)

    audio.addEventListener('play', markPlaying)
    audio.addEventListener('pause', markPaused)
    audio.addEventListener('ended', markPaused)
    startPlayback()
    document.addEventListener('pointerdown', startPlayback, { capture: true, once: true })
    document.addEventListener('keydown', startPlayback, { capture: true, once: true })

    return () => {
      audio.pause()
      audio.removeEventListener('play', markPlaying)
      audio.removeEventListener('pause', markPaused)
      audio.removeEventListener('ended', markPaused)
      document.removeEventListener('pointerdown', startPlayback, { capture: true })
      document.removeEventListener('keydown', startPlayback, { capture: true })
    }
  }, [audioUrl])

  if (!audioUrl) return null

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }

  return (
    <div className="invitation-music-player mt-2 flex items-center gap-3 rounded-[18px] bg-slate-950 px-4 py-3 text-white shadow-lg">
      <Music2 className="size-4 shrink-0 text-[#fcb39e]" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">Música de la invitación</p>
      <button
        type="button"
        onClick={togglePlayback}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition hover:bg-[#fcb39e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcb39e]"
        aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? <Pause className="size-4" aria-hidden="true" /> : <Play className="ml-0.5 size-4" aria-hidden="true" />}
      </button>
      <audio ref={audioRef} src={audioUrl} preload="auto" className="absolute h-px w-px opacity-0" aria-hidden="true" />
    </div>
  )
}
