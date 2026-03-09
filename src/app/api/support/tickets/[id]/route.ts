import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

// GET /api/support/tickets/[id] — ticket detail + messages (no internal notes)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getUserProfile()
  if (!profile?.practice_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at')
    .eq('id', params.id)
    .eq('practice_id', profile.practice_id)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('support_ticket_messages')
    .select('id, sender_id, sender_role, body, is_internal, created_at, users(full_name)')
    .eq('ticket_id', params.id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ticket, messages: messages ?? [] })
}
