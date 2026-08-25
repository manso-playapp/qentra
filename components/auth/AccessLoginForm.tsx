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
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="operator-email" className="block text-sm font-medium text-white/80">
          Email
        </label>
        <input
          id="operator-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(eventInput) => setEmail(eventInput.target.value)}
          className="mt-2 block w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ff8b70] focus:ring-2 focus:ring-[#ff8b70]/25"
          placeholder="operador@alista.com"
        />
      </div>

      <div>
        <label htmlFor="operator-password" className="block text-sm font-medium text-white/80">
          Contraseña
        </label>
        <input
          id="operator-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(eventInput) => setPassword(eventInput.target.value)}
          className="mt-2 block w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ff8b70] focus:ring-2 focus:ring-[#ff8b70]/25"
          placeholder="Ingresá tu contraseña"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[#ff8b70] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando...' : 'Continuar'}
      </button>
    </form>
  )
}
