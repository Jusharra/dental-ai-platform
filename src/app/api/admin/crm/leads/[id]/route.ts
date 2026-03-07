import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifySuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const service = createServiceClient()

  // If booking just toggled to true, stop sequence + mark hot
  if (body.booking_link_clicked === true) {
    body.status               = 'Booked'
    body.lead_score           = 'Hot'
    body.email_sequence_stage = 'Complete'
    body.next_email_date      = null

    // Fire hot lead notification (non-blocking)
    const { data: lead } = await service
      .from('crm_leads').select('first_name, email, track').eq('id', params.id).single()

    if (lead) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const trackLabel = lead.track === 'track_1' ? 'Track 1 (Revenue Recovery)' : 'Track 2 (Governance)'
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL ?? 'shay@first-choicecyber.com',
        to:      process.env.RESEND_FROM_EMAIL ?? 'shay@first-choicecyber.com',
        subject: `HOT LEAD: ${lead.first_name} just clicked your booking link!`,
        text:    `HOT LEAD ALERT!\n\nName: ${lead.first_name}\nEmail: ${lead.email}\nTrack: ${trackLabel}\n\nCheck your Cal.com for their booking.\n\nReview lead: ${process.env.NEXT_PUBLIC_APP_URL}/admin/crm/${params.id}`,
      }).catch(console.error)
    }
  }

  const { data, error } = await service
    .from('crm_leads')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifySuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service.from('crm_leads').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
