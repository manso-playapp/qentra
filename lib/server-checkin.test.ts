import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), client: vi.fn(), pin: vi.fn(), supervisorRequired: vi.fn(), supervisorPin: vi.fn(),
}))
vi.mock('@/lib/operator-auth', () => ({
  ensureAuthorizedEventApiAccess: mocks.auth,
  verifySecurityOverridePin: mocks.pin,
  isSecuritySupervisorPinConfigured: mocks.supervisorRequired,
  verifySecuritySupervisorPin: mocks.supervisorPin,
}))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdminClient: mocks.client }))
import { performEventCheckin } from './server-checkin'

type GuestFixture = {
  id: string; event_id: string; first_name: string; last_name: string; status: string;
  payment_status: string | null; notes: string; plus_ones_confirmed: number;
  companion_names: string[]; guest_types: null;
}
let guest: GuestFixture
let occupancy: number
let lastCheckin: { checked_in_at: string } | null
let historyError: { message: string } | null
let tokenActive: boolean
let rpc: ReturnType<typeof vi.fn>

function database() {
  rpc = vi.fn().mockResolvedValue({ data: { checkin_id: 'c1' }, error: null })
  return {
    rpc,
    from(table: string) {
      const result = (single: boolean) => {
        if (table === 'events') return { data: { id: 'event', event_date: '2026-09-05', start_time: '22:00', max_capacity: 10 }, error: null }
        if (table === 'guests') return { data: guest, error: null }
        if (table === 'invitation_tokens') return { data: { id: 'token-id', guest_id: 'guest', expires_at: '2099-01-01T00:00:00Z', max_uses: 1, used_count: 0, last_used_at: null, is_active: tokenActive }, error: null }
        return { data: single ? lastCheckin : [{ admitted_people: occupancy }], error: single ? historyError : null }
      }
      const query = {
        select: vi.fn(() => query), eq: vi.fn(() => query), order: vi.fn(() => query), limit: vi.fn(() => query),
        maybeSingle: vi.fn(async () => result(true)),
        then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result(false)).then(resolve),
      }
      return query
    },
  }
}

async function request(body: unknown) {
  const response = await performEventCheckin(new Request('http://localhost/api/events/event/checkin', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  }), 'event')
  return { status: response.status, body: await response.json() }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '') // Never contact a real broadcast endpoint.
  mocks.auth.mockResolvedValue({ response: null })
  mocks.pin.mockImplementation((pin: string) => pin === 'correct')
  mocks.supervisorRequired.mockReturnValue(false)
  mocks.supervisorPin.mockImplementation((pin: string) => pin === 'supervisor')
  guest = { id: 'guest', event_id: 'event', first_name: 'Ana', last_name: 'Prueba', status: 'enabled', payment_status: 'not_required', notes: '', plus_ones_confirmed: 1, companion_names: ['Sol Prueba'], guest_types: null }
  occupancy = 8
  lastCheckin = null
  historyError = null
  tokenActive = true
  mocks.client.mockReturnValue(database())
})

describe('server check-in boundary', () => {
  it('requires event authorization before touching data', async () => {
    mocks.auth.mockResolvedValue({ response: Response.json({ error: 'No access' }, { status: 403 }) })
    expect((await request({ guestId: 'guest' })).status).toBe(403)
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it.each([null, [], { token: 42 }, { guestId: 'guest', method: 'other' }, { guestId: 'guest', override: { code: 'already_checked_in', pin: 5 } }])('rejects malformed input %j', async (input) => {
    expect((await request(input)).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })
  it.each(['pending', null])('denies a %s payment despite approved legacy notes', async (payment_status) => {
    guest.payment_status = payment_status
    guest.notes = 'Pago: approved'
    const result = await request({ guestId: 'guest' })
    expect(result.body.data.decisionCode).toBe('payment_pending')
    expect(result.body.data.overrideable).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('blocks the whole group when one place remains', async () => {
    occupancy = 9
    const result = await request({ guestId: 'guest' })
    expect(result.body.data.decisionCode).toBe('event_full')
    expect(result.body.data.overrideable).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('counts confirmed companions even when names are missing', async () => {
    occupancy = 9
    guest.companion_names = []
    expect((await request({ guestId: 'guest' })).body.data.decisionCode).toBe('event_full')
  })
  it('previews without writing, then uses the guarded transaction for approval', async () => {
    expect((await request({ token: 'qr', method: 'qr', intent: 'preview' })).body.data.outcome).toBe('ready')
    expect(rpc).not.toHaveBeenCalled()
    expect((await request({ token: 'qr', method: 'qr', intent: 'approve' })).body.data.outcome).toBe('registered')
    expect(rpc).toHaveBeenCalledWith('register_guest_checkin_guarded', expect.objectContaining({ p_guest_id: 'guest', p_invitation_token_id: 'token-id', p_override_code: null }))
  })
  it('does not preview an inactive token as ready', async () => {
    tokenActive = false
    expect((await request({ token: 'qr', intent: 'preview' })).body.data.outcome).toBe('blocked')
    expect(rpc).not.toHaveBeenCalled()
  })
  it('does not approve if history cannot be verified', async () => {
    historyError = { message: 'database timeout' }
    expect((await request({ guestId: 'guest' })).status).toBe(503)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('rejects an exception that only supplies its code and reason', async () => {
    guest.status = 'checked_in'
    expect((await request({ guestId: 'guest', override: { code: 'already_checked_in', reason: 'reingreso' } })).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('validates both PINs during the write when a supervisor is configured', async () => {
    guest.status = 'checked_in'
    mocks.supervisorRequired.mockReturnValue(true)
    const override = { code: 'already_checked_in', reason: 'Reingreso revisado', pin: 'correct' }
    expect((await request({ guestId: 'guest', override })).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
    const result = await request({ guestId: 'guest', override: { ...override, supervisorPin: 'supervisor' } })
    expect(result.body.data.outcome).toBe('registered')
    expect(rpc).toHaveBeenCalledWith('register_guest_checkin_guarded', expect.objectContaining({ p_override_code: 'already_checked_in' }))
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('correct')
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('supervisor')
  })
  it('does not allow even a valid PIN to bypass the capacity', async () => {
    occupancy = 10
    expect((await request({ guestId: 'guest', override: { code: 'event_full', pin: 'correct', reason: 'Excepción' } })).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('reports a race rejected by the transaction without claiming admission', async () => {
    rpc.mockResolvedValue({ error: { code: 'P0001', message: 'event_full' } })
    const result = await request({ guestId: 'guest' })
    expect(result.status).toBe(409)
    expect(result.body.error).toContain('cupo')
    expect(result.body.data).toBeUndefined()
  })
  it('fails closed if the migration is missing, without falling back to the old RPC', async () => {
    rpc.mockResolvedValue({ error: { code: 'PGRST202', message: 'function missing' } })
    expect((await request({ guestId: 'guest' })).status).toBe(503)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc.mock.calls[0][0]).toBe('register_guest_checkin_guarded')
  })
})
