import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/** POST — mark the current user as MFA-enrolled in the users table */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  await service.from('users').update({ mfa_enrolled_at: new Date().toISOString() }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
