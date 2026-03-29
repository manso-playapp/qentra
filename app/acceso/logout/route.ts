import { redirect } from 'next/navigation'
import { isMissingAuthSessionError } from '@/lib/supabase-auth-errors'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error && !isMissingAuthSessionError(error)) {
    throw error
  }

  redirect('/acceso?logged_out=1')
}
