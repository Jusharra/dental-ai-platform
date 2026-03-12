import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  const { pathname } = request.nextUrl

  // ── Public paths — no auth required ─────────────────────────────────────────
  const publicPaths = [
    '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback', '/api/',
    '/how-it-works', '/solutions', '/pricing', '/faqs', '/contact',
    '/privacy', '/terms', '/hipaa', '/verify-insurance',
    '/admin/login',
  ]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) || pathname === '/'

  // ── /admin/* — requires super_admin role ─────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    // Check role — lightweight, no joins
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // MFA check for admin paths (handled below — fall through)
  }

  // ── /admin/login — authenticated super_admin → skip to admin dashboard ───────
  if (pathname === '/admin/login' && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── Unauthenticated non-public path ──────────────────────────────────────────
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Authenticated: redirect away from auth pages ─────────────────────────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Authenticated on root → dashboard ────────────────────────────────────────
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── MFA Enforcement (all authenticated, non-public, non-MFA paths) ───────────
  // Skip MFA check on: public paths, the MFA pages themselves, API routes
  const skipMfa = isPublic || pathname.startsWith('/mfa/')
  if (!skipMfa && user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
      // User has MFA enrolled but hasn't verified this session → require challenge
      const url = request.nextUrl.clone()
      url.pathname = '/mfa/verify'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    if (aal?.currentLevel === 'aal1' && aal.nextLevel === 'aal1') {
      // No MFA factor enrolled — check grace period
      const { data: profile } = await supabase
        .from('users')
        .select('mfa_grace_period_ends')
        .eq('id', user.id)
        .single()

      const gracePeriodEnds = profile?.mfa_grace_period_ends
        ? new Date(profile.mfa_grace_period_ends)
        : null

      if (!gracePeriodEnds || gracePeriodEnds <= new Date()) {
        // Grace period expired — force MFA setup
        const url = request.nextUrl.clone()
        url.pathname = '/mfa/setup'
        return NextResponse.redirect(url)
      }

      // Within grace period — pass end date to the app via header for the banner
      supabaseResponse.headers.set('x-mfa-grace-ends', gracePeriodEnds.toISOString())
    }
  }

  return supabaseResponse
}
