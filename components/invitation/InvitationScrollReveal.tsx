'use client'

import { useEffect } from 'react'

// Observa los bloques de Noche una sola vez y les agrega la clase visible al
// entrar en el viewport. El contenido sigue visible si JavaScript no carga.
export default function InvitationScrollReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-invitation-template="midnight"]')
    if (!root) return

    const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-invitation-block]'))
    if (blocks.length === 0) return

    blocks.forEach((block, index) => {
      block.style.setProperty('--invitation-reveal-delay', `${Math.min(index * 70, 280)}ms`)
    })

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      blocks.forEach((block) => block.classList.add('is-visible'))
      return
    }

    root.classList.add('invitation-reveal-ready')

    // Marca inmediatamente los bloques que ya están en pantalla. Esto evita
    // que el primer bloque dependa del primer callback del observer durante la
    // hidratación, especialmente cuando el navegador restaura el scroll.
    const viewportBottom = window.innerHeight * 0.92
    blocks.forEach((block) => {
      const rect = block.getBoundingClientRect()
      if (rect.top < viewportBottom && rect.bottom > 0) block.classList.add('is-visible')
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )

    blocks.forEach((block) => observer.observe(block))
    return () => observer.disconnect()
  }, [])

  return null
}
