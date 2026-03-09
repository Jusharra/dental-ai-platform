import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

async function requireAdmin() {
  const profile = await getUserProfile()
  if (profile?.role !== 'super_admin') return null
  return profile
}

// GET /api/admin/support/tickets/[id] — ticket detail + all messages (incl. internal)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at, resolved_at, practices(id, name)')
    .eq('id', params.id)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('support_ticket_messages')
    .select('id, sender_id, sender_role, body, is_internal, created_at, users(full_name)')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ticket, messages: messages ?? [] })
}

// PATCH /api/admin/support/tickets/[id] — update status + priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const patch: Record<string, unknown> = {}

  if (body.status)   patch.status = body.status
  if (body.priority) patch.priority = body.priority

  if (body.status === 'resolved' || body.status === 'closed') {
    patch.resolved_at = new Date().toISOString()
  } else if (body.status === 'open' || body.status === 'in_progress') {
    patch.resolved_at = null
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('support_tickets')
    .update(patch)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
