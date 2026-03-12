import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'

function generateCode(): string {
  const hex = randomBytes(6).toString('hex').toUpperCase()
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
}

function hashCode(code: string): string {
  return createHash('sha256').update(code.replace(/-/g, '')).digest('hex')
}

/** POST — generate 8 fresh recovery codes for the current user (call after MFA enrollment) */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Delete old codes first
  await service.from('mfa_recovery_codes').delete().eq('user_id', user.id)

  const codes = Array.from({ length: 8 }, generateCode)
  const rows = codes.map((code) => ({ user_id: user.id, code_hash: hashCode(code) }))

  const { error } = await service.from('mfa_recovery_codes').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ codes })
}
