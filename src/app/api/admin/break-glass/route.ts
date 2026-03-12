import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { safeEqual } from '@/lib/cron-auth'

/**
 * POST — Emergency (break glass) access for super_admin.
 * Validates a server-side BREAK_GLASS_SECRET, deletes the caller's TOTP factor,
 * and resets their grace period to 1 hour — forcing immediate MFA re-enrollment.
 *
 * Every invocation is audit-logged in break_glass_logs regardless of outcome.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verify super_admin role
  const { data: profile } = await service
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { emergencyCode } = await request.json()
  const bgSecret = process.env.BREAK_GLASS_SECRET ?? ''

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null

  if (!bgSecret || !safeEqual(emergencyCode ?? '', bgSecret)) {
    // Log failed attempt
    await service.from('break_glass_logs').insert({
      user_id: user.id,
      user_email: profile.email,
      ip_address: ip,
      user_agent: userAgent,
      note: 'FAILED — invalid emergency code',
    })
    return NextResponse.json({ error: 'Invalid emergency code' }, { status: 401 })
  }

  // Delete all TOTP factors — the refreshed session will be AAL1 (valid without MFA)
  const { data: factorData } = await service.auth.admin.mfa.listFactors({ userId: user.id })
  for (const factor of factorData?.factors?.filter(f => f.factor_type === 'totp') ?? []) {
    await service.auth.admin.mfa.deleteFactor({ userId: user.id, id: factor.id })
  }

  // Set a 1-hour grace period — user must re-enroll MFA immediately after login
  await service.from('users').update({
    mfa_enrolled_at: null,
    mfa_grace_period_ends: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }).eq('id', user.id)

  // Audit log — SUCCESS
  await service.from('break_glass_logs').insert({
    user_id: user.id,
    user_email: profile.email,
    ip_address: ip,
    user_agent: userAgent,
    note: 'SUCCESS — MFA bypassed via break glass. Re-enrollment required within 1 hour.',
  })

  return NextResponse.json({ ok: true })
}
