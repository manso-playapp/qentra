import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FestiveBackdrop } from '@/components/marketing/FestiveBackdrop'

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
    <section className="relative overflow-hidden">
      <FestiveBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-16 sm:pt-24">
      <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        {eyebrow}
      </span>
      <h1 className="mt-6 max-w-3xl text-balance font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl">
        {title}
        {highlight ? <span className="text-brand-cyan"> {highlight}</span> : null}
      </h1>
      <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{description}</p>
      {(primaryCta || secondaryCta) && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {primaryCta && (
            <Button asChild size="lg">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          )}
          {secondaryCta && (
            <Button asChild size="lg" variant="outline">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      )}
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
    <section className={muted ? 'border-y border-border/60 bg-secondary/30' : ''}>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        {(eyebrow || title || description) && (
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{description}</p>
            )}
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
  primary = { href: '/demo', label: 'Solicitar una demostración' },
  secondary = { href: '/contacto', label: 'Hablar con el equipo' },
}: {
  title: string
  description: string
  primary?: Cta
  secondary?: Cta
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="overflow-hidden rounded-[2.5rem] bg-admin-navy px-8 py-16 text-center text-white sm:px-16">
        <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-white/70">{description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
