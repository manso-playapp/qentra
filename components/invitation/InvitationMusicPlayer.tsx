'use client'

import { useEffect, useRef } from 'react'

type SpotifyEmbedController = {
  play: () => void
  destroy?: () => void
  addListener: (event: 'ready', callback: () => void) => void
}

type SpotifyIFrameApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string; height: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void
    spotifyIFrameApi?: SpotifyIFrameApi
  }
}

const SPOTIFY_TRACK_URI = 'spotify:track:5Q0Nhxo0l2bP3pNjpGJwV1'
const SPOTIFY_IFRAME_API_URL = 'https://open.spotify.com/embed/iframe-api/v1'

/**
 * Spotify puede bloquear autoplay con sonido. Intentamos al cargar y, si el
 * navegador lo impide, el primer toque sobre la invitacion inicia la musica.
 */
export default function InvitationMusicPlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)

  useEffect(() => {
    let disposed = false
    let playbackStarted = false

    const startPlaybackFromInteraction = () => {
      const controller = controllerRef.current

      if (!controller || playbackStarted) return

      controller.play()
      playbackStarted = true
    }

    const initializeEmbed = (iframeApi: SpotifyIFrameApi) => {
      if (disposed || !containerRef.current) return

      iframeApi.createController(
        containerRef.current,
        { uri: SPOTIFY_TRACK_URI, width: '100%', height: '152' },
        (controller) => {
          if (disposed) {
            controller.destroy?.()
            return
          }

          // Sin este permiso Spotify solo entrega una vista previa corta en
          // navegadores que requieren contenido cifrado para la pista completa.
          containerRef.current?.querySelector('iframe')?.setAttribute(
            'allow',
            'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
          )
          controllerRef.current = controller
          controller.addListener('ready', () => {
            controller.play()
          })
        }
      )
    }

    const previousReadyHandler = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (iframeApi) => {
      window.spotifyIFrameApi = iframeApi
      previousReadyHandler?.(iframeApi)
      initializeEmbed(iframeApi)
    }

    if (window.spotifyIFrameApi) {
      initializeEmbed(window.spotifyIFrameApi)
    }

    const script = document.querySelector<HTMLScriptElement>('script[data-spotify-iframe-api]')
      ?? document.createElement('script')

    if (!script.dataset.spotifyIframeApi) {
      script.src = SPOTIFY_IFRAME_API_URL
      script.async = true
      script.dataset.spotifyIframeApi = 'true'
      document.body.appendChild(script)
    }

    document.addEventListener('pointerdown', startPlaybackFromInteraction, { capture: true })
    document.addEventListener('keydown', startPlaybackFromInteraction, { capture: true })

    return () => {
      disposed = true
      window.onSpotifyIframeApiReady = previousReadyHandler
      document.removeEventListener('pointerdown', startPlaybackFromInteraction, { capture: true })
      document.removeEventListener('keydown', startPlaybackFromInteraction, { capture: true })
      controllerRef.current?.destroy?.()
      controllerRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="mt-2 h-38 w-full overflow-hidden rounded-[18px]" />
}
