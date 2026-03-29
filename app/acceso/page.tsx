import Link from 'next/link'
import { redirect } from 'next/navigation'
import AccessLoginForm from '@/components/auth/AccessLoginForm'
import { sanitizeNextPath } from '@/lib/operator-auth'
import { isMissingAuthSessionError } from '@/lib/supabase-auth-errors'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type AccessPageProps = {
  searchParams: Promise<{
    error?: string
    logged_out?: string
    next?: string
  }>
}

function getErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case 'oauth':
      return 'No se pudo completar la autenticacion.'
    default:
      return null
  }
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const resolvedSearchParams = await searchParams
  const nextPath = sanitizeNextPath(resolvedSearchParams.next, '/admin')
  const errorMessage = getErrorMessage(resolvedSearchParams.error)
  const loggedOut = resolvedSearchParams.logged_out === '1'
  const supabase = await createServerSupabaseClient()
  let user = null

  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error && !isMissingAuthSessionError(error)) {
      throw error
    }

    user = authUser
  } catch (error) {
    if (!isMissingAuthSessionError(error)) {
      throw error
    }
  }

  if (user) {
    redirect(nextPath)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_38%,#020617_100%)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Qentra Access
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white">
            Acceso operativo para admin, puerta y totem
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Esta capa ahora usa Supabase Auth con sesion real por usuario y control
            de roles operativos sobre admin, puerta, totem y APIs sensibles.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Admin</p>
              <p className="mt-3 text-sm text-slate-200">
                Gestion de eventos, invitados y configuracion.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Puerta</p>
              <p className="mt-3 text-sm text-slate-200">
                Control de ingreso con scanner, busqueda y alertas.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Totem</p>
              <p className="mt-3 text-sm text-slate-200">
                Superficie cerrada para escaneo rapido en recepcion.
              </p>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white">Ingresar</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Usa tu usuario de Supabase Auth para abrir las superficies operativas.
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          {loggedOut && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              La sesion operativa se cerro correctamente.
            </div>
          )}
          <AccessLoginForm nextPath={nextPath} />

          <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-400">
            <Link href="/" className="text-slate-300 hover:text-white">
              Volver al inicio
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
