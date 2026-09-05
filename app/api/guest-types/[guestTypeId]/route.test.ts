import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ client: vi.fn(), auth: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdminClient: mocks.client }))
vi.mock('@/lib/operator-auth', () => ({ ensureAuthorizedEventApiAccess: mocks.auth }))
import { PATCH } from './route'

let update: ReturnType<typeof vi.fn>
let eventLookup: ReturnType<typeof vi.fn>
let stored: Record<string, unknown>

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ response: null })
  stored = {
    id: 'type', event_id: 'event', name: 'Trasnoche', payment_amount_cents: 12500,
    access_start_time: '20:30:00', access_end_time: '05:00:00',
    access_start_day_offset: 0, access_end_day_offset: 1,
  }
  update = vi.fn()
  eventLookup = vi.fn(async () => ({ data: { start_time: '20:30:00' }, error: null }))
  const types = {
    select: vi.fn(() => types), eq: vi.fn(() => types), update,
    maybeSingle: vi.fn(async () => ({ data: stored, error: null })),
    single: vi.fn(async () => ({ data: stored, error: null })),
  }
  const events = { select: vi.fn(() => events), eq: vi.fn(() => events), maybeSingle: eventLookup }
  update.mockReturnValue(types)
  mocks.client.mockReturnValue({ from: vi.fn((table) => table === 'events' ? events : types) })
})

const context = { params: Promise.resolve({ guestTypeId: 'type' }) }
function patch(body: unknown) {
  return PATCH(new Request('http://localhost/api/guest-types/type', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), context)
}

describe('PATCH guest type effective access schedule', () => {
  it('rejects noon to 05:00 on day 1 without updating', async () => {
    const response = await patch({ access_start_time: '12:00', access_start_day_offset: 1 })
    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('posterior')
    expect(update).not.toHaveBeenCalled()
  })
  it('accepts 20:30 day 0 to 05:00 day 1', async () => {
    expect((await patch({ access_start_time: '20:30', access_end_time: '05:00' })).status).toBe(200)
    expect(update).toHaveBeenCalledWith({ access_start_time: '20:30', access_end_time: '05:00' })
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it('accepts midnight on day 1', async () => {
    expect((await patch({ access_start_time: '00:00', access_start_day_offset: 1 })).status).toBe(200)
    expect(update).toHaveBeenCalledOnce()
  })
  it('validates an end-day-only PATCH against the stored start', async () => {
    expect((await patch({ access_end_day_offset: 0 })).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it('validates a start-time-only PATCH against the stored end and day', async () => {
    stored.access_start_time = '00:00:00'
    stored.access_start_day_offset = 1
    expect((await patch({ access_start_time: '12:00' })).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it('validates an end-time-only PATCH against the stored start and day', async () => {
    stored.access_start_time = '02:00:00'
    stored.access_start_day_offset = 1
    expect((await patch({ access_end_time: '01:00' })).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it('clears a boundary using the empty string from the form', async () => {
    expect((await patch({ access_end_time: '' })).status).toBe(200)
    expect(update).toHaveBeenCalledWith({ access_end_time: null })
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it('preserves legacy null-offset inference using the event start time', async () => {
    stored.access_start_day_offset = null
    stored.access_end_day_offset = null
    expect((await patch({ access_end_time: '06:00' })).status).toBe(200)
    expect(eventLookup).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith({ access_end_time: '06:00' })
  })
  it('does not block another field due to an invalid legacy schedule', async () => {
    stored.access_start_day_offset = 1
    stored.access_start_time = '12:00:00'
    expect((await patch({ name: 'Trasnoche actualizado', payment_amount_cents: 17000 })).status).toBe(200)
    expect(update).toHaveBeenCalledWith({ name: 'Trasnoche actualizado', payment_amount_cents: 17000 })
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it('treats an empty PATCH as a no-op even for an invalid legacy schedule', async () => {
    stored.access_start_time = 'invalid'
    const response = await patch({})
    expect(response.status).toBe(200)
    expect((await response.json()).data).toEqual(stored)
    expect(update).not.toHaveBeenCalled()
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it.each([
    { access_start_time: { hour: 20 } }, { access_end_time: ['05:00'] },
    { access_start_time: '24:00' }, { access_end_time: '05:70' },
    { access_start_day_offset: '1' }, { access_end_day_offset: {} },
    { access_start_day_offset: -1 }, { access_end_day_offset: 366 },
    { access_end_day_offset: 1.5 },
  ])('rejects malformed schedule %j without updating', async (body) => {
    expect((await patch(body)).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it.each([null, [], 'invalid'])('rejects non-object JSON %j', async (body) => {
    expect((await patch(body)).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it('returns 400 for invalid JSON', async () => {
    const response = await PATCH(new Request('http://localhost/api/guest-types/type', { method: 'PATCH', body: '{' }), context)
    expect(response.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
  it('preserves event authorization before lookup or mutation', async () => {
    mocks.auth.mockResolvedValue({ response: Response.json({ error: 'No access' }, { status: 403 }) })
    expect((await patch({ access_end_day_offset: null })).status).toBe(403)
    expect(eventLookup).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
  it('preserves rejection of a negative price without writing', async () => {
    expect((await patch({ payment_amount_cents: -1 })).status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
})
