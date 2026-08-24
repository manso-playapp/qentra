import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

type Cta = { href: string; label: string }

export function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string
  title: string
  highlight?: string
  description: string
  primaryCta?: Cta
  secondaryCta?: Cta
}) {
  return (
    <section className="overflow-hidden border-b border-black/10 bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">{eyebrow}</p>
          <h1 className="marketing-display mt-6 max-w-4xl text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.91] tracking-[-0.005em] text-[#171714]">
            {title}
            {highlight ? <span className="text-[#213480]"> {highlight}</span> : null}
          </h1>
        </div>

        <div className="lg:pb-1">
          <p className="max-w-xl text-base leading-7 text-black/58">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#213480] px-6 text-sm font-black text-white transition hover:bg-[#009cdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-offset-2"
                >
                  {primaryCta.label}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/20 px-6 text-sm font-black text-[#171714] transition hover:border-black hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function Section({
  eyebrow,
  title,
  description,
  children,
  muted = false,
}: {
  eyebrow?: string
  title?: string
  description?: string
  children?: ReactNode
  muted?: boolean
}) {
  return (
    <section className={muted ? 'bg-[#e7ded0]' : 'bg-[#f0eee8]'}>
      <div className="mx-auto w-full max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        {(eyebrow || title || description) && (
          <div className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              {eyebrow && (
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">{eyebrow}</p>
              )}
              {title && (
                <h2 className="marketing-display mt-5 max-w-3xl text-[clamp(2.5rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
                  {title}
                </h2>
              )}
            </div>
            {description && <p className="max-w-xl text-base leading-7 text-black/58">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function ClosingCta({
  title,
  description,
  primary = { href: '/demo', label: 'Quiero conocer Alista' },
  secondary = { href: '/contacto', label: 'Hablar con el equipo' },
}: {
  title: string
  description: string
  primary?: Cta
  secondary?: Cta
}) {
  return (
    <section className="bg-[#213480] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-14">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="marketing-display max-w-3xl text-[clamp(2.7rem,4.75vw,4.75rem)] font-black leading-[0.91] tracking-[-0.005em]">
            {title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/62">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href={primary.href}
            className="inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {primary.label}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/24 px-6 text-sm font-black text-white transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
