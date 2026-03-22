import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Handles Supabase auth redirects — magic links and email confirmations.
 * Cookies MUST be set on the response object, not via next/headers,
 * otherwise the session is lost after the redirect and middleware bounces to /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Pre-initialise response so the setAll cookie callback can attach to it
    let response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Write to request so subsequent reads in this handler see them
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            // Re-create the redirect so we get a fresh Headers object, then
            // attach every session cookie to it — this is what the browser receives
            response = NextResponse.redirect(`${origin}${next}`)
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response  // carries the session cookies to the browser
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
