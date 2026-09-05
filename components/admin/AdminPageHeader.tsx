import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AdminPageHeader({ title, description, eyebrow, backHref, backLabel = 'Volver al evento', actions }: {
  title: string
  description?: string
  eyebrow?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6">
      {backHref ? <Link href={backHref} className="inline-flex min-h-9 items-center text-xs font-medium text-primary hover:underline">← {backLabel}</Link> : null}
      <div className="mt-2 flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p> : null}
          <h1 className="admin-heading break-words text-3xl leading-tight text-admin-navy sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
