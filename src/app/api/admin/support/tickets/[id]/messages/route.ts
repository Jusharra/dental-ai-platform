import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

// POST /api/admin/support/tickets/[id]/messages — admin reply or internal note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getUserProfile()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { body, is_internal } = await request.json()
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // If it's a real reply (not internal) and ticket is resolved/closed, reopen to in_progress
  if (!is_internal) {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('status')
      .eq('id', params.id)
      .single()

    if (ticket?.status === 'resolved' || ticket?.status === 'closed') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress', resolved_at: null })
        .eq('id', params.id)
    }
  }

  const { data: message, error } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id:   params.id,
      sender_id:   profile.id,
      sender_role: 'super_admin',
      body:        body.trim(),
      is_internal: is_internal ?? false,
    })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(message, { status: 201 })
}
