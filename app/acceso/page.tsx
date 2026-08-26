import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import AccessLoginForm from '@/components/auth/AccessLoginForm'
import { sanitizeNextPath } from '@/lib/operator-auth'
import { isAuthRetryableFetchError, isMissingAuthSessionError } from '@/lib/supabase-auth-errors'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Acceso',
}

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

    if (error && !isMissingAuthSessionError(error) && !isAuthRetryableFetchError(error)) {
      throw error
    }

    user = authUser
  } catch (error) {
    if (!isMissingAuthSessionError(error) && !isAuthRetryableFetchError(error)) {
      throw error
    }
  }

  if (user) {
    redirect(nextPath)
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#171714] px-5 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(198,80,53,0.36),transparent_28%),radial-gradient(circle_at_8%_90%,rgba(33,52,128,0.52),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-md flex-col py-7 sm:py-9">
        <Link
          href="/"
          className="inline-flex w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171714]"
          aria-label="Alista, inicio"
        >
          <Image src="/alista-logo-white.svg" alt="Alista" width={1890} height={387} className="h-6 w-auto" priority />
        </Link>

        <section className="my-auto py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff8b70]">Acceso</p>
          <h1 className="marketing-display mt-5 text-5xl font-black leading-[0.88] tracking-[-0.02em] sm:text-6xl">
            Entrá a Alista.
          </h1>
          <p className="mt-5 text-sm leading-6 text-white/62">
            Usá tus datos para continuar.
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          {loggedOut ? (
            <div className="mt-6 rounded-2xl border border-[#d9ee73]/25 bg-[#d9ee73]/10 p-4 text-sm text-[#edf9b2]">
              La sesión se cerró correctamente.
            </div>
          ) : null}

          <AccessLoginForm nextPath={nextPath} />
        </section>

        <Link href="/" className="w-fit text-xs font-bold uppercase tracking-[0.18em] text-white/45 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
