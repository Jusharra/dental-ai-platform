import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Pulls call cost data from Retell AI API and back-fills retell_cost_cents
 * on call_logs rows that have a retell_call_id but no cost yet.
 *
 * Retell call object includes: call_id, call_cost (USD float), duration_ms
 * Docs: https://docs.retellai.com/api-references/list-calls
 */
export async function POST(request: NextRequest) {
  // Allow super_admin or cron secret
  const cronSecret = request.headers.get('x-cron-secret')
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  // Find call_logs with a retell_call_id but zero cost
  const { data: pendingLogs } = await service
    .from('call_logs')
    .select('id, retell_call_id')
    .not('retell_call_id', 'is', null)
    .eq('retell_cost_cents', 0)
    .limit(100)

  if (!pendingLogs?.length) {
    return NextResponse.json({ synced: 0, message: 'No pending logs' })
  }

  const retellKey = process.env.RETELL_API_KEY
  if (!retellKey) return NextResponse.json({ error: 'RETELL_API_KEY not configured' }, { status: 500 })

  let synced = 0
  let failed = 0

  for (const log of pendingLogs) {
    try {
      const res = await fetch(`https://api.retellai.com/v2/get-call/${log.retell_call_id}`, {
        headers: { Authorization: `Bearer ${retellKey}` },
      })

      if (!res.ok) { failed++; continue }

      const call = await res.json()
      const costCents = call.call_cost ? Math.round(call.call_cost * 100) : 0
      const durationSeconds = call.duration_ms ? Math.round(call.duration_ms / 1000) : null

      const update: Record<string, number | null> = { retell_cost_cents: costCents }
      if (durationSeconds !== null) update.call_duration_seconds = durationSeconds

      await service.from('call_logs').update(update).eq('id', log.id)
      synced++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ synced, failed, total: pendingLogs.length })
}