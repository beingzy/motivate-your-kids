import { NextResponse, type NextRequest } from 'next/server'

/**
 * v1 — trust-based, no auth enforcement.
 * All routes are publicly accessible; role selection is a UI convention only.
 * Supabase auth gating is deferred to v2 (multi-device sync).
 */
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest).*)',
  ],
}
