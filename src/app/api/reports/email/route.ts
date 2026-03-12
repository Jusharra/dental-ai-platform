import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role, practice_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, start, end, recipient_email, practice_id: practiceIdParam } = body

  if (!type || !start || !end || !recipient_email) {
    return NextResponse.json({ error: 'type, start, end, recipient_email required' }, { status: 400 })
  }

  const practiceId = (profile.role === 'super_admin' && practiceIdParam) ? practiceIdParam : profile.practice_id!
  const service = createServiceClient()

  const { data: practice } = await service.from('practices').select('name').eq('id', practiceId).single()
  const practiceName = practice?.name ?? 'Your Practice'

  // Build PDF
  const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/pdf?type=${type}&start=${start}&end=${end}&practice_id=${practiceId}`
  // We generate the PDF buffer inline to attach it
  const pdfRes = await fetch(pdfUrl, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })
  const pdfBuffer = await pdfRes.arrayBuffer()
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

  const typeLabel: Record<string, string> = {
    call_performance: 'Call Performance',
    confirmation: 'Appointment Confirmation',
    recall: 'Recall Campaign',
    insurance: 'Insurance Verification',
    executive: 'Executive Summary',
  }
  const label = typeLabel[type] ?? type
  const dateLabel = `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'reports@firstchoicecyber.com',
    to: recipient_email,
    subject: `${label} Report — ${practiceName} (${dateLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">PatientGuard AI</p>
          <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 4px 0;">${label} Report</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">${practiceName} · ${dateLabel}</p>
        </div>
        <p style="color: #374151; line-height: 1.6;">Please find your <strong>${label}</strong> report attached for the period <strong>${dateLabel}</strong>.</p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">This report was generated automatically. If you have questions, please contact your account manager.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} PatientGuard AI. Confidential.</p>
      </div>
    `,
    attachments: [{
      filename: `${type}-report-${start}-${end}.pdf`,
      content: pdfBase64,
    }],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Log subscription if requested
  if (body.save_subscription) {
    await service.from('report_subscriptions').upsert({
      practice_id: practiceId,
      report_type: type,
      frequency: 'monthly',
      recipient_email,
      is_active: true,
    }, { onConflict: 'practice_id,report_type,recipient_email' })
  }

  return NextResponse.json({ success: true })
}