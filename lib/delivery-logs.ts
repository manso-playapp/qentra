import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

type PersistDeliveryLogInput = {
  event_id: string
  guest_id: string
  invitation_token_id?: string
  delivery_profile_id?: string
  channel: 'email' | 'whatsapp'
  provider?: 'resend' | 'twilio' | 'manual'
  recipient: string
  status: 'sent' | 'failed'
  external_id?: string
  error_message?: string
}

export async function persistDeliveryLog(payload: PersistDeliveryLogInput) {
  const adminClient = getSupabaseAdminClient()
  const client = adminClient ?? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { error } = await client
    .from('delivery_logs')
    .insert(payload)

  if (error) {
    throw error
  }
}
