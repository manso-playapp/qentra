import Link from 'next/link'
import {
  ArrowRight,
  CircleAlert,
  Clock3,
  GitCommitHorizontal,
  History,
  ListChecks,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ALISTA_CHANGELOG,
  ALISTA_CHANGELOG_UPDATED_AT,
  ALISTA_OPEN_ITEMS,
  type AlistaChange,
  type AlistaChangeKind,
} from '@/lib/alista-changelog'
import { APP_VERSION } from '@/lib/version'

export const metadata = {
  title: 'Estado ALISTA',
}

const KIND_META: Record<AlistaChangeKind, { label: string; variant: 'info' | 'success' | 'warning' | 'outline' }> = {
  producto: { label: 'Producto', variant: 'info' },
  experiencia: { label: 'Experiencia', variant: 'success' },
  estabilidad: { label: 'Estabilidad', variant: 'warning' },
  documentación: { label: 'Documentación', variant: 'outline' },
}

function groupChangesByDate(changes: AlistaChange[]) {
  const groups: { date: string; changes: AlistaChange[] }[] = []

  for (const change of changes) {
    const current = groups.at(-1)
    if (current?.date === change.date) {
      current.changes.push(change)
    } else {
      groups.push({ date: change.date, changes: [change] })
    }
  }

  return groups
}

function ChangeEntry({ change }: { change: AlistaChange }) {
  const kind = KIND_META[change.kind]

  return (
    <li className="relative pl-7 sm:pl-9">
      <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-sky-500 ring-4 ring-card" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{change.area}</span>
        <Badge variant={kind.variant}>{kind.label}</Badge>
        <code className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          <GitCommitHorizontal className="size-3.5" />
          {change.commit}
        </code>
      </div>
      <h3 className="mt-2 text-base font-semibold leading-6 text-foreground">{change.title}</h3>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{change.summary}</p>
    </li>
  )
}

export default function AlistaStatusPage() {
  const groups = groupChangesByDate(ALISTA_CHANGELOG)
  const latestChange = ALISTA_CHANGELOG[0]

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <section className="rounded-3xl bg-admin-navy p-6 text-white shadow-[0_18px_50px_rgba(23,37,84,0.18)] sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">Alista {APP_VERSION}</Badge>
                <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <Clock3 className="size-3.5" />
                  Actualizado {ALISTA_CHANGELOG_UPDATED_AT}
                </span>
              </div>
              <h1 className="admin-heading mt-5 text-4xl leading-tight text-white sm:text-5xl">
                Estado ALISTA
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Registro de decisiones, mejoras y correcciones que mantienen la aplicación lista para operar.
                Cada entrada resume qué cambió y qué impacto tiene.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:flex sm:border-t-0 sm:pt-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/70">Cambios registrados</p>
                <p className="mt-1 text-3xl font-semibold text-white">{ALISTA_CHANGELOG.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/70">Último commit</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-white">{latestChange.commit}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground shadow-[0_18px_50px_rgba(69,46,24,0.06)]" aria-labelledby="changelog-title">
          <header className="border-b border-border/60 px-6 py-6 sm:px-8">
            <div className="flex items-start gap-3">
              <span className="grid size-10 flex-none place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <History className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Historial de cambios</p>
                <h2 id="changelog-title" className="admin-heading mt-1 text-2xl text-foreground">Qué cambió y cuándo</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Un registro cronológico y resumido de los cambios que afectan al producto. Los hashes permiten volver al detalle técnico cuando hace falta.
                </p>
              </div>
            </div>
          </header>

          <div>
            {groups.map((group) => (
              <div key={group.date} className="border-b border-border/60 px-6 py-6 last:border-b-0 sm:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <time dateTime={group.date} className="text-sm font-semibold text-foreground">{group.changes[0].dateLabel}</time>
                  <span className="text-xs text-muted-foreground">{group.changes.length} {group.changes.length === 1 ? 'cambio' : 'cambios'}</span>
                </div>
                <ol className="mt-5 space-y-6 border-l border-sky-200 pl-0">
                  {group.changes.map((change) => <ChangeEntry key={change.commit} change={change} />)}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200/80 bg-amber-50/60" aria-labelledby="open-items-title">
          <div className="border-b border-amber-200/70 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-5 flex-none text-amber-700" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Para revisar</p>
                <h2 id="open-items-title" className="admin-heading mt-1 text-2xl text-amber-950">Decisiones abiertas</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">Sólo se muestran asuntos que todavía requieren una decisión o una verificación.</p>
              </div>
            </div>
          </div>
          <ul className="divide-y divide-amber-200/70 px-6 sm:px-8">
            {ALISTA_OPEN_ITEMS.map((item) => (
              <li key={item.title} className="flex gap-3 py-4">
                <ListChecks className="mt-0.5 size-4 flex-none text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-amber-900/80">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex justify-end">
          <Button asChild variant="outline">
            <Link href="/admin/events">
              Ir a la agenda
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
