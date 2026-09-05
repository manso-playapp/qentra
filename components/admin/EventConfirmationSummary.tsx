import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { summarizeEventConfirmations } from '@/lib/event-confirmation-summary'

type Props = {
  guests: readonly { status: string | null }[]
  unavailable?: boolean
  guestsHref: string
}

export default function EventConfirmationSummary({ guests, unavailable, guestsHref }: Props) {
  const summary = summarizeEventConfirmations(guests)
  const percentage = summary.total ? Math.round(summary.confirmed / summary.total * 100) : 0
  const segments = [
    { label: 'Confirmadas', count: summary.confirmed, color: '#243566' },
    { label: 'Sin respuesta', count: summary.awaiting, color: '#91c5dd' },
    { label: 'Sin invitación', count: summary.uninvited, color: '#dce5ed' },
    { label: 'No habilitadas', count: summary.disabled, color: '#b39a88' },
    { label: 'Por revisar', count: summary.unknown, color: '#9c8ab4' },
  ]
  const visibleSegments = segments.filter((segment, index) => index < 3 || segment.count > 0)
  const arcs = segments.map((segment, index) => ({
    ...segment,
    length: summary.total ? segment.count / summary.total * 100 : 0,
    offset: summary.total ? segments.slice(0, index).reduce((sum, item) => sum + item.count, 0) / summary.total * 100 : 0,
  }))

  return (
    <section className="flex h-full min-w-0 flex-col rounded-3xl border border-border/70 bg-white p-5 shadow-[0_8px_32px_-24px_rgba(20,29,71,0.2)] sm:p-6" aria-labelledby="confirmations-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Así viene tu fiesta</p>
          <h2 id="confirmations-heading" className="admin-heading mt-1 text-2xl text-foreground">Confirmaciones</h2>
        </div>
        <Link href={guestsHref} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-slate-50">
          Ver invitados <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {unavailable ? (
        <p role="status" className="my-auto py-12 text-sm text-muted-foreground">No pudimos cargar las confirmaciones. Volvé a cargar la página para intentarlo otra vez.</p>
      ) : (
        <>
          <div className="my-auto grid items-center gap-6 py-7 sm:grid-cols-[minmax(140px,0.9fr)_minmax(0,1fr)]">
            <div className="relative mx-auto aspect-square w-full max-w-[208px]">
              <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="100" cy="100" r="82" fill="none" stroke="#edf1f5" strokeWidth="17" />
                {arcs.filter((arc) => arc.count > 0).map((arc) => (
                  <circle key={arc.label} cx="100" cy="100" r="82" pathLength="100" fill="none" stroke={arc.color} strokeWidth="17"
                    strokeDasharray={`${arc.length} ${100 - arc.length}`} strokeDashoffset={-arc.offset} />
                ))}
                <circle cx="100" cy="100" r="65" fill="none" stroke="#f1f4f7" strokeWidth="1" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="admin-heading text-4xl tabular-nums tracking-tight text-admin-navy">{summary.total ? `${percentage}%` : '—'}</span>
                <span className="mt-1 text-xs text-muted-foreground">{summary.total ? 'confirmadas' : 'Sin invitados'}</span>
                {summary.total > 0 ? <span className="mt-2 text-[11px] tabular-nums text-muted-foreground">{summary.confirmed} de {summary.total}</span> : null}
              </div>
            </div>
            <dl className="space-y-3.5">
              {visibleSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="flex items-center gap-2.5 text-muted-foreground"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />{segment.label}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{segment.count}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="border-t border-border/60 pt-4 text-xs leading-5 text-muted-foreground">
            {summary.total ? 'Se cuenta una invitación por titular o grupo, sin sumar acompañantes. Confirmar no implica tener el pago aprobado.' : 'Cargá los invitados para empezar a seguir sus confirmaciones.'}
          </p>
        </>
      )}
    </section>
  )
}
