import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { safeEqual } from '@/lib/cron-auth'
import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const EMAIL_SCHEDULE: Record<number, { daysUntilNext: number; nextStage: string }> = {
  1: { daysUntilNext: 2,  nextStage: 'Email 2 of 9' },
  2: { daysUntilNext: 3,  nextStage: 'Email 3 of 9' },
  3: { daysUntilNext: 2,  nextStage: 'Email 4 of 9' },
  4: { daysUntilNext: 3,  nextStage: 'Email 5 of 9' },
  5: { daysUntilNext: 4,  nextStage: 'Email 6 of 9' },
  6: { daysUntilNext: 3,  nextStage: 'Email 7 of 9' },
  7: { daysUntilNext: 4,  nextStage: 'Email 8 of 9' },
  8: { daysUntilNext: 7,  nextStage: 'Email 9 of 9' },
  9: { daysUntilNext: 0,  nextStage: 'Complete'      },
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? ''
  if (!safeEqual(auth, `Bearer ${process.env.CRON_SECRET ?? ''}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch leads that are due for an email
  const { data: leads, error } = await service
    .from('crm_leads')
    .select('*')
    .neq('status', 'Unsubscribed')
    .neq('email_sequence_stage', 'Complete')

  if (error) {
    console.error('CRM email sequences error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  let sent = 0, skipped = 0, failed = 0

  for (const lead of leads ?? []) {
    try {
      const emailNum = parseInt((lead.email_sequence_stage as string).match(/\d+/)?.[0] ?? '0')
      if (!emailNum) { skipped++; continue }

      // Determine if this lead is due
      const isFirstEmail = emailNum === 1 && !lead.last_email_sent
      const isDue = lead.next_email_date && new Date(lead.next_email_date) <= today

      if (!isFirstEmail && !isDue) { skipped++; continue }

      // Find matching template
      const isCold = emailNum === 1 && lead.source === 'Manual'
      const trackLabel = lead.track === 'track_1' ? 'Track 1' : 'Track 2'

      const { data: template } = await service
        .from('crm_email_templates')
        .select('subject_line, body')
        .eq('track', trackLabel)
        .eq('email_number', emailNum)
        .eq('is_cold', isCold)
        .single()

      if (!template?.subject_line || !template?.body) {
        console.warn(`No template for ${trackLabel} Email ${emailNum} (cold=${isCold})`)
        skipped++
        continue
      }

      const subject = replaceMergeFields(template.subject_line, lead, appUrl)
      const body    = replaceMergeFields(template.body, lead, appUrl)

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'shay@first-choicecyber.com',
        to: lead.email,
        subject,
        text: body,
      })

      // Advance the sequence
      const schedule = EMAIL_SCHEDULE[emailNum] ?? { daysUntilNext: 0, nextStage: 'Complete' }
      const nextDate = schedule.daysUntilNext > 0
        ? new Date(today.getTime() + schedule.daysUntilNext * 86400000).toISOString().split('T')[0]
        : null

      await service.from('crm_leads').update({
        last_email_sent:      new Date().toISOString(),
        next_email_date:      nextDate,
        email_sequence_stage: schedule.nextStage,
      }).eq('id', lead.id)

      sent++
    } catch (err) {
      console.error(`Failed for lead ${lead.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, skipped, failed })
}

type Lead = Record<string, unknown>

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num)
}

function replaceMergeFields(text: string, lead: Lead, appUrl: string): string {
  const totalLoss = Number(lead.total_annual_revenue_loss) || 0

  return text
    .replace(/\[FIRST_NAME\]/g,            String(lead.first_name ?? ''))
    .replace(/\[LAST_NAME\]/g,             String(lead.last_name ?? ''))
    .replace(/\[BUSINESS_NAME\]/g,         String(lead.business_name ?? ''))
    .replace(/\[EMAIL\]/g,                 String(lead.email ?? ''))
    .replace(/\[SPECIALTY\]/g,             String(lead.practice_specialty ?? ''))
    .replace(/\[MONTHLY_APPOINTMENTS\]/g,  String(lead.monthly_appointments ?? ''))
    .replace(/\[AFTER_HOURS_LOSS\]/g,      formatCurrency(Number(lead.after_hours_loss) || 0))
    .replace(/\[HOLD_TIME_LOSS\]/g,        formatCurrency(Number(lead.hold_time_loss) || 0))
    .replace(/\[NO_SHOW_LOSS\]/g,          formatCurrency(Number(lead.no_show_loss) || 0))
    .replace(/\[TOTAL_LOSS\]/g,            formatCurrency(totalLoss))
    .replace(/\[MONTHLY_LOSS\]/g,          formatCurrency(totalLoss / 12))
    .replace(/\[DAILY_LOSS\]/g,            formatCurrency(totalLoss / 365))
    .replace(/\[JOB_TITLE\]/g,             String(lead.job_title ?? ''))
    .replace(/\[ORG_SIZE\]/g,              String(lead.organization_size ?? ''))
    .replace(/\[GOVERNANCE_SCORE\]/g,      String(lead.governance_score ?? ''))
    .replace(/\[RISK_LEVEL\]/g,            String(lead.risk_level ?? ''))
    .replace(/\[BOOKING_LINK\]/g,          'https://cal.com/shay-goree')
    .replace(/\[UNSUBSCRIBE_LINK\]/g,      `${appUrl}/api/crm/unsubscribe?token=${lead.unsubscribe_token}`)
}
