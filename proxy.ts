import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase-proxy'
import { requiresSupabaseSessionRefresh } from '@/lib/supabase-proxy-paths'

export async function proxy(request: NextRequest) {
  // No renovar la sesión sobre el stream multipart: el endpoint valida la
  // autorización por su cuenta y así preservamos intacto el cuerpo del upload.
  if (request.nextUrl.pathname === '/api/uploads' && request.method === 'POST' && request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    return NextResponse.next({ request })
  }

  if (!requiresSupabaseSessionRefresh(request.nextUrl.pathname)) {
    return NextResponse.next({ request })
  }

  return updateSupabaseSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
