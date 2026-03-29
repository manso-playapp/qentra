import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'

export default function GuestsPage() {
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-5xl rounded-[30px] border border-[color:var(--admin-line)] bg-[color:var(--admin-surface)] p-8 shadow-[0_20px_60px_rgba(86,62,38,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[color:var(--admin-muted)]">Recepcion y directorios</p>
          <h1 className="admin-heading mt-3 text-5xl leading-none text-[color:var(--admin-ink)]">Modulo de invitados</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--admin-muted)]">
            Aqui vamos a cerrar la capa global de directorios y vistas cruzadas. El backend ya tiene operacion real por evento; falta consolidar la lectura transversal del universo de invitados.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 p-5">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--admin-muted)]">Actual</p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--admin-ink)]">CRUD por evento</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--admin-muted)]">
                Alta, estados, QR, delivery y check-in ya funcionan dentro de cada evento.
              </p>
            </div>
            <div className="rounded-[24px] bg-[color:var(--admin-accent-soft)] p-5">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--admin-muted)]">Falta</p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--admin-ink)]">Vista global</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--admin-muted)]">
                Buscar invitados entre eventos, detectar repeticiones y mirar actividad cruzada.
              </p>
            </div>
            <div className="rounded-[24px] bg-[linear-gradient(160deg,#182433_0%,#24364d_100%)] p-5 text-white">
              <p className="text-[11px] uppercase tracking-[0.26em] text-sky-200/70">Siguiente paso</p>
              <p className="mt-3 text-lg font-semibold">Modelo transversal</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Cuando lo abordemos, este modulo va a convertirse en la vista maestra de operacion.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/events"
              className="rounded-2xl border border-[color:var(--admin-line)] bg-white/80 px-5 py-4 text-sm font-semibold text-[color:var(--admin-ink)] transition hover:bg-white"
            >
              Ir a eventos
            </Link>
            <Link
              href="/admin/events/new"
              className="rounded-2xl bg-[color:var(--admin-accent)] px-5 py-4 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Crear evento
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
