import { performEventCheckin } from '@/lib/server-checkin'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return performEventCheckin(request, id)
}
