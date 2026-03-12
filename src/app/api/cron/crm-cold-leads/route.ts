import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { safeEqual } from '@/lib/cron-auth'

/**
 * Marks leads as Cold after 30 days with no booking.
 * Scheduled daily at midnight UTC via Supabase pg_cron.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? ''
  if (!safeEqual(auth, `Bearer ${process.env.CRON_SECRET ?? ''}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: leads, error } = await service
    .from('crm_leads')
    .select('id, email_sequence_stage')
    .lt('created_at', thirtyDaysAgo)
    .eq('booking_link_clicked', false)
    .neq('status', 'Booked')
    .neq('status', 'Unsubscribed')
    .neq('lead_score', 'Cold')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let marked = 0

  for (const lead of leads ?? []) {
    const updates: Record<string, string> = { lead_score: 'Cold' }
    if (lead.email_sequence_stage !== 'Complete') {
      updates.email_sequence_stage = 'Complete'
    }
    await service.from('crm_leads').update(updates).eq('id', lead.id)
    marked++
  }

  return NextResponse.json({ marked })
}
