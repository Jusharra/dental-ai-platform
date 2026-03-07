import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Public unsubscribe handler — linked from email footers.
 * GET /api/crm/unsubscribe?token=<unsubscribe_token>
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 })
  }

  const service = createServiceClient()

  const { data: lead } = await service
    .from('crm_leads')
    .select('id, first_name, status')
    .eq('unsubscribe_token', token)
    .single()

  if (!lead) {
    return new NextResponse('Link not found or already processed.', { status: 404 })
  }

  if (lead.status === 'Unsubscribed') {
    return new NextResponse(unsubscribedPage(lead.first_name, true), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  await service.from('crm_leads').update({
    status:               'Unsubscribed',
    email_sequence_stage: 'Complete',
    next_email_date:      null,
  }).eq('id', lead.id)

  return new NextResponse(unsubscribedPage(lead.first_name, false), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubscribedPage(name: string, alreadyDone: boolean): string {
  const msg = alreadyDone
    ? 'You are already unsubscribed.'
    : `You've been successfully unsubscribed, ${name || 'there'}.`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribed</title>
<style>
  body { font-family: sans-serif; background: #0f172a; color: #cbd5e1; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 40px; max-width: 400px; text-align: center; }
  h1 { color: #f8fafc; font-size: 20px; margin: 0 0 12px; }
  p { color: #94a3b8; font-size: 14px; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <h1>Unsubscribed</h1>
    <p>${msg} You won't receive any more emails from First-Choice Cyber.</p>
  </div>
</body>
</html>`
}
