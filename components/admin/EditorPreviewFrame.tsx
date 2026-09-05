'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fit the existing 540px preview canvas to the available frame, including on mobile. */
export default function EditorPreviewFrame({ kind, children }: { kind: 'invitation' | 'totem'; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(2 / 3)

  useEffect(() => {
    if (!frame.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setScale(entry.contentRect.width / 540)
    })
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frame} className={`${kind}-editor-thumbnail mx-auto h-[min(680px,70dvh)] w-full max-w-[360px] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[32px] border-4 border-slate-900 bg-black shadow-xl`}>
      <div className={`${kind}-editor-canvas`} style={{ zoom: scale }}>{children}</div>
    </div>
  )
}
