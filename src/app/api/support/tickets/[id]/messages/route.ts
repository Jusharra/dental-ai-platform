import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

// POST /api/support/tickets/[id]/messages — practice user reply
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getUserProfile()
  if (!profile?.practice_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { body } = await request.json()
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  }

  const supabase = createClient()

  // Verify ticket belongs to this practice
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', params.id)
    .eq('practice_id', profile.practice_id)
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // If resolved/closed, reopen to 'open'
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    await supabase
      .from('support_tickets')
      .update({ status: 'open', resolved_at: null })
      .eq('id', params.id)
  }

  const { data: message, error } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id:   params.id,
      sender_id:   profile.id,
      sender_role: 'practice_user',
      body:        body.trim(),
    })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(message, { status: 201 })
}
