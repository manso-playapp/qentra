import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ client: vi.fn(), auth: vi.fn(), checkin: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdminClient: mocks.client }))
vi.mock('@/lib/operator-auth', () => ({ ensureAuthorizedEventApiAccess: mocks.auth }))
vi.mock('@/lib/server-checkin', () => ({ performEventCheckin: mocks.checkin }))
import { PATCH } from './route'

let rpc: ReturnType<typeof vi.fn>
let update: ReturnType<typeof vi.fn>
let currentStatus: string

beforeEach(() => {
  vi.clearAllMocks()
  currentStatus = 'enabled'
  mocks.auth.mockResolvedValue({ response: null })
  mocks.checkin.mockResolvedValue(Response.json({ data: { outcome: 'blocked', detail: 'Pago pendiente.' } }))
  rpc = vi.fn()
  update = vi.fn()
  const query = {
    select: vi.fn(() => query), eq: vi.fn(() => query), update,
    maybeSingle: vi.fn(async () => ({ data: { event_id: 'event', status: currentStatus }, error: null })),
    single: vi.fn(async () => ({ data: { id: 'guest', event_id: 'event', status: 'checked_in', first_name: 'Ana', last_name: 'Prueba' }, error: null })),
  }
  update.mockReturnValue(query)
  mocks.client.mockReturnValue({ from: vi.fn(() => query), rpc })
})

function patch(body: unknown) {
  return PATCH(new Request('http://localhost/api/guests/guest', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ guestId: 'guest' }) })
}

describe('manual guest admission', () => {
  it('cannot bypass a payment block through PATCH', async () => {
    const response = await patch({ status: 'checked_in' })
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('Pago pendiente.')
    expect(mocks.checkin).toHaveBeenCalledOnce()
    const [request, event] = mocks.checkin.mock.calls[0]
    expect(event).toBe('event')
    expect(await request.json()).toEqual({ guestId: 'guest', method: 'manual' })
    expect(rpc).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
  it('returns the guest after successful shared admission without writing status again', async () => {
    mocks.checkin.mockResolvedValue(Response.json({ data: { outcome: 'registered' } }))
    const response = await patch({ status: 'checked_in' })
    expect(response.status).toBe(200)
    expect((await response.json()).data.status).toBe('checked_in')
    expect(update).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
  it('rejects mixed edits before any admission or mutation', async () => {
    const response = await patch({ status: 'checked_in', plus_ones_confirmed: 8 })
    expect(response.status).toBe(400)
    expect(mocks.checkin).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
  it('does not allow restoration and admission in the same request', async () => {
    currentStatus = 'checked_in'
    expect((await patch({ status: 'checked_in', restore_invitation_access: true })).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('keeps event authorization on the PATCH entry point', async () => {
    mocks.auth.mockResolvedValue({ response: Response.json({ error: 'No access' }, { status: 403 }) })
    expect((await patch({ status: 'checked_in' })).status).toBe(403)
    expect(mocks.checkin).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
})
