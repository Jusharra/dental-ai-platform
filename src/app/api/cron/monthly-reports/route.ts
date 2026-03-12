import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildReport, type ReportType } from '@/lib/reports'
import { safeEqual } from '@/lib/cron-auth'
import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

/**
 * Vercel Cron: runs on the 1st of each month.
 * vercel.json: { "crons": [{ "path": "/api/cron/monthly-reports", "schedule": "0 8 1 * *" }] }
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization') ?? ''
  if (!safeEqual(secret, `Bearer ${process.env.CRON_SECRET ?? ''}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Prior month date range
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfPriorMonth = new Date(firstOfThisMonth.getTime() - 1)
  const firstOfPriorMonth = new Date(lastOfPriorMonth.getFullYear(), lastOfPriorMonth.getMonth(), 1)
  const start = firstOfPriorMonth.toISOString().split('T')[0]
  const end   = lastOfPriorMonth.toISOString().split('T')[0]

  const service = createServiceClient()

  const { data: subscriptions } = await service
    .from('report_subscriptions')
    .select('id, practice_id, report_type, recipient_email, practices(name)')
    .eq('frequency', 'monthly')
    .eq('is_active', true)

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, message: 'No active subscriptions' })
  }

  let sent = 0, failed = 0

  for (const sub of subscriptions) {
    try {
      const practice = sub.practices as unknown as { name: string } | null
      const practiceName = practice?.name ?? 'Your Practice'
      const reportData = await buildReport(service, sub.report_type as ReportType, sub.practice_id, start, end)

      // Generate PDF inline
      const pdfRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/pdf?type=${sub.report_type}&start=${start}&end=${end}&practice_id=${sub.practice_id}`,
        { headers: { 'x-cron-secret': process.env.CRON_SECRET ?? '' } }
      )
      const pdfBuffer = await pdfRes.arrayBuffer()
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

      const typeLabel: Record<string, string> = {
        call_performance: 'Call Performance',
        confirmation: 'Appointment Confirmation',
        recall: 'Recall Campaign',
        insurance: 'Insurance Verification',
        executive: 'Executive Summary',
      }
      const label = typeLabel[sub.report_type] ?? sub.report_type
      const monthLabel = firstOfPriorMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      // Suppress unused variable warning — reportData used for future inline summary
      void reportData

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'reports@firstchoicecyber.com',
        to: sub.recipient_email,
        subject: `Monthly ${label} Report — ${practiceName} (${monthLabel})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">PatientGuard AI</p>
              <h1 style="color: #fff; font-size: 22px; margin: 0;">Your Monthly ${label} Report</h1>
              <p style="color: #64748b; margin: 4px 0 0;">${practiceName} · ${monthLabel}</p>
            </div>
            <p style="color: #374151;">Your <strong>${monthLabel}</strong> report is attached.</p>
            <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} PatientGuard AI. Confidential.</p>
          </div>
        `,
        attachments: [{
          filename: `${sub.report_type}-${start}-${end}.pdf`,
          content: pdfBase64,
        }],
      })

      await service.from('report_subscriptions').update({ last_sent_at: new Date().toISOString() }).eq('id', sub.id)
      sent++
    } catch (err) {
      console.error(`Failed for subscription ${sub.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, period: `${start} to ${end}` })
}