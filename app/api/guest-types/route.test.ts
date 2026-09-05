import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ client: vi.fn(), auth: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdminClient: mocks.client }))
vi.mock('@/lib/operator-auth', () => ({ ensureAuthorizedEventApiAccess: mocks.auth }))
import { POST } from './route'

let insert: ReturnType<typeof vi.fn>
let eventLookup: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ response: null })
  insert = vi.fn()
  eventLookup = vi.fn(async () => ({ data: { start_time: '20:30:00' }, error: null }))
  const types = {
    insert,
    select: vi.fn(() => types),
    single: vi.fn(async () => ({ data: { id: 'type' }, error: null })),
  }
  const events = { select: vi.fn(() => events), eq: vi.fn(() => events), maybeSingle: eventLookup }
  insert.mockReturnValue(types)
  mocks.client.mockReturnValue({ from: vi.fn((table) => table === 'events' ? events : types) })
})

const valid = {
  event_id: 'event', name: 'Trasnoche', access_start_time: '20:30', access_end_time: '05:00',
  access_start_day_offset: 0, access_end_day_offset: 1,
}
function post(body: unknown) {
  return POST(new Request('http://localhost/api/guest-types', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }))
}

describe('POST guest type access schedule', () => {
  it('rejects noon to 05:00 on the same next day without inserting', async () => {
    const response = await post({ ...valid, access_start_time: '12:00', access_start_day_offset: 1 })
    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('posterior')
    expect(insert).not.toHaveBeenCalled()
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it('accepts evening to early morning on the following day and preserves price', async () => {
    expect((await post({ ...valid, payment_amount_cents: 12500, show_gift_info: false })).status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      access_start_time: '20:30', access_end_time: '05:00',
      access_start_day_offset: 0, access_end_day_offset: 1,
      payment_amount_cents: 12500, show_gift_info: false,
    }))
    expect(eventLookup).not.toHaveBeenCalled()
  })
  it('accepts midnight on day 1 as distinct from noon', async () => {
    expect((await post({ ...valid, access_start_time: '00:00', access_start_day_offset: 1 })).status).toBe(200)
    expect(insert).toHaveBeenCalledOnce()
  })
  it('uses the event start only when explicit null offsets require legacy inference', async () => {
    expect((await post({ ...valid, access_start_day_offset: null, access_end_day_offset: null })).status).toBe(200)
    expect(eventLookup).toHaveBeenCalledOnce()
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ access_start_day_offset: null, access_end_day_offset: null }))
  })
  it('allows no schedule without looking up event time', async () => {
    expect((await post({ event_id: 'event', name: 'Familia' })).status).toBe(200)
    expect(eventLookup).not.toHaveBeenCalled()
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ access_start_time: null, access_end_time: null }))
  })
  it.each([
    { access_start_time: '24:00' }, { access_end_time: '5:00' },
    { access_start_time: { hour: 20 } }, { access_end_time: ['05:00'] },
    { access_start_day_offset: '1' }, { access_end_day_offset: {} },
    { access_start_day_offset: -1 }, { access_end_day_offset: 366 },
    { access_end_day_offset: 0.5 },
  ])('rejects malformed schedule %j without inserting', async (schedule) => {
    expect((await post({ ...valid, ...schedule })).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
  it.each([null, [], 'invalid'])('rejects non-object JSON %j', async (body) => {
    expect((await post(body)).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
  it('returns 400 for invalid JSON without throwing', async () => {
    const response = await POST(new Request('http://localhost/api/guest-types', { method: 'POST', body: '{' }))
    expect(response.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
  it('preserves authorization before schedule lookup or write', async () => {
    mocks.auth.mockResolvedValue({ response: Response.json({ error: 'No access' }, { status: 403 }) })
    expect((await post({ ...valid, access_end_day_offset: null })).status).toBe(403)
    expect(eventLookup).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })
})
