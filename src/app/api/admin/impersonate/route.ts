import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/impersonate — start impersonating a practice
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { practice_id } = await request.json()
  if (!practice_id) return NextResponse.json({ error: 'practice_id required' }, { status: 400 })

  // Verify practice exists
  const service = createServiceClient()
  const { data: practice } = await service
    .from('practices').select('id, name').eq('id', practice_id).single()
  if (!practice) return NextResponse.json({ error: 'Practice not found' }, { status: 404 })

  // Log to audit table
  await service.from('audit_logs').insert({
    user_id: user.id,
    action: 'read',
    resource_type: 'practice',
    resource_id: practice_id,
    changes: { impersonation: 'started', practice_name: practice.name, admin: profile.full_name },
    impersonated_practice_id: practice_id,
    impersonated_by: user.id,
  })

  const response = NextResponse.json({ success: true, practice_name: practice.name })
  response.cookies.set('admin_impersonating', practice_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  return response
}

// DELETE /api/admin/impersonate — end impersonation
export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_impersonating', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
