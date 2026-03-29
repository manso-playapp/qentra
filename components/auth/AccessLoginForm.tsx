'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

type AccessLoginFormProps = {
  nextPath: string
}

export default function AccessLoginForm({ nextPath }: AccessLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw error
      }

      router.replace(nextPath)
      router.refresh()
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="operator-email" className="block text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="operator-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(eventInput) => setEmail(eventInput.target.value)}
          className="mt-2 block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400"
          placeholder="operador@qentra.com"
        />
      </div>

      <div>
        <label htmlFor="operator-password" className="block text-sm font-medium text-slate-200">
          Password
        </label>
        <input
          id="operator-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(eventInput) => setPassword(eventInput.target.value)}
          className="mt-2 block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400"
          placeholder="Ingresa tu password"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando...' : 'Continuar'}
      </button>
    </form>
  )
}
