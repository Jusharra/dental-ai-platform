import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

function hashCode(code: string): string {
  return createHash('sha256').update(code.replace(/-/g, '').toUpperCase()).digest('hex')
}

/**
 * POST — validate a recovery code and, if valid, delete the user's TOTP factor
 * so the current AAL1 session becomes valid. The client must call
 * supabase.auth.refreshSession() after this succeeds.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const service = createServiceClient()
  const hash = hashCode(code)

  const { data: row } = await service
    .from('mfa_recovery_codes')
    .select('id')
    .eq('user_id', user.id)
    .eq('code_hash', hash)
    .is('used_at', null)
    .single()

  if (!row) {
    return NextResponse.json({ error: 'Invalid or already-used recovery code' }, { status: 401 })
  }

  // Mark code as used
  await service.from('mfa_recovery_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id)

  // Delete all TOTP factors so the AAL1 session becomes fully valid
  const { data: factorData } = await service.auth.admin.mfa.listFactors({ userId: user.id })
  for (const factor of factorData?.factors?.filter(f => f.factor_type === 'totp') ?? []) {
    await service.auth.admin.mfa.deleteFactor({ userId: user.id, id: factor.id })
  }

  // Clear our mfa_enrolled_at so the grace period banner appears (14 more days to re-enroll)
  await service.from('users').update({
    mfa_enrolled_at: null,
    mfa_grace_period_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
