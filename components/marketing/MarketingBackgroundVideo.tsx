'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

type MarketingBackgroundVideoProps = {
  className?: string
  eager?: boolean
  label?: string
  onPlaybackChange?: (playing: boolean) => void
}

export const MarketingBackgroundVideo = forwardRef<
  HTMLVideoElement,
  MarketingBackgroundVideoProps
>(function MarketingBackgroundVideo(
  { className, eager = false, label, onPlaybackChange },
  forwardedRef,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [shouldShowPoster, setShouldShowPoster] = useState(eager)

  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video

    if (typeof forwardedRef === 'function') {
      forwardedRef(video)
      return
    }

    if (forwardedRef) {
      forwardedRef.current = video
    }
  }, [forwardedRef])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame: number | undefined
    let observer: IntersectionObserver | undefined

    function stopLoading() {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = undefined
      }

      observer?.disconnect()
      observer = undefined
    }

    function prepareVideo() {
      stopLoading()

      if (eager) {
        setShouldShowPoster(true)

        if (reducedMotion.matches) {
          videoRef.current?.pause()
          return
        }

        animationFrame = window.requestAnimationFrame(() => {
          setShouldLoad(true)
        })
        return
      }

      const video = videoRef.current
      if (!video) return

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return

          setShouldShowPoster(true)
          if (!reducedMotion.matches) {
            setShouldLoad(true)
          }
          observer?.disconnect()
          observer = undefined
        },
        { rootMargin: '600px 0px' },
      )

      observer.observe(video)
    }

    function handleMotionPreferenceChange() {
      if (reducedMotion.matches) {
        videoRef.current?.pause()
        setShouldLoad(false)
      }

      prepareVideo()
    }

    prepareVideo()
    reducedMotion.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      stopLoading()
      reducedMotion.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [eager])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !shouldLoad) return

    video.load()
    void video.play().catch(() => {
      onPlaybackChange?.(false)
    })
  }, [onPlaybackChange, shouldLoad])

  return (
    <video
      ref={setVideoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={shouldShowPoster ? '/hero-poster.jpg' : undefined}
      disablePictureInPicture
      aria-hidden={label ? undefined : true}
      aria-label={label}
      onPlay={() => onPlaybackChange?.(true)}
      onPause={() => onPlaybackChange?.(false)}
    >
      {shouldLoad ? (
        <>
          <source
            src="/hero-mobile.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          <source src="/hero-desktop.mp4" type="video/mp4" />
        </>
      ) : null}
      Tu navegador no puede reproducir este video.
    </video>
  )
})
