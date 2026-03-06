import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const start = searchParams.get('start')!
  const end = searchParams.get('end')!
  const practiceIdParam = searchParams.get('practice_id')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role, practice_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const practiceId = (profile.role === 'super_admin' && practiceIdParam) ? practiceIdParam : profile.practice_id!
  const service = createServiceClient()

  let csv = ''
  let filename = ''

  if (type === 'call_performance' || !type) {
    const { data: rows } = await service
      .from('call_logs')
      .select('call_date, call_type, call_outcome, call_duration_seconds, retell_cost_cents, phone_number, agent_type')
      .eq('practice_id', practiceId)
      .gte('call_date', start)
      .lte('call_date', end)
      .order('call_date')

    const headers = ['Date', 'Call Type', 'Outcome', 'Duration (s)', 'Cost ($)', 'Phone', 'Agent']
    const lines = (rows ?? []).map(r => [
      r.call_date,
      r.call_type ?? '',
      r.call_outcome ?? '',
      r.call_duration_seconds ?? 0,
      ((r.retell_cost_cents ?? 0) / 100).toFixed(2),
      r.phone_number ?? '',
      r.agent_type ?? '',
    ].map(String).join(','))

    csv = [headers.join(','), ...lines].join('\n')
    filename = `call-performance-${start}-${end}.csv`
  } else if (type === 'confirmation') {
    const { data: rows } = await service
      .from('call_logs')
      .select('call_date, call_type, call_outcome, call_duration_seconds, phone_number')
      .eq('practice_id', practiceId)
      .in('call_type', ['confirmation_7day', 'confirmation_3day', 'confirmation_1day', 'reminder_3hour'])
      .gte('call_date', start)
      .lte('call_date', end)
      .order('call_date')

    const headers = ['Date', 'Call Type', 'Outcome', 'Duration (s)', 'Phone']
    const lines = (rows ?? []).map(r => [
      r.call_date, r.call_type ?? '', r.call_outcome ?? '', r.call_duration_seconds ?? 0, r.phone_number ?? '',
    ].map(String).join(','))
    csv = [headers.join(','), ...lines].join('\n')
    filename = `confirmation-${start}-${end}.csv`
  } else if (type === 'recall') {
    const { data: rows } = await service
      .from('call_logs')
      .select('call_date, call_outcome, call_duration_seconds, phone_number, patients(patient_name)')
      .eq('practice_id', practiceId)
      .eq('call_type', 'recall')
      .gte('call_date', start)
      .lte('call_date', end)
      .order('call_date')

    const headers = ['Date', 'Patient', 'Outcome', 'Duration (s)', 'Phone']
    const lines = (rows ?? []).map((r: Record<string, unknown>) => {
      const patient = r.patients as { patient_name: string } | null
      return [
        r.call_date, patient?.patient_name ?? '', r.call_outcome ?? '', r.call_duration_seconds ?? 0, r.phone_number ?? '',
      ].map(String).join(',')
    })
    csv = [headers.join(','), ...lines].join('\n')
    filename = `recall-${start}-${end}.csv`
  } else if (type === 'insurance') {
    const { data: rows } = await service
      .from('insurance_verifications')
      .select('created_at, status, sent_to_email, patient_submitted_at, staff_verified_at, patients(patient_name)')
      .eq('practice_id', practiceId)
      .gte('created_at', start)
      .lte('created_at', end + 'T23:59:59')
      .order('created_at')

    const headers = ['Created', 'Patient', 'Status', 'Sent To', 'Patient Submitted', 'Staff Verified']
    const lines = (rows ?? []).map((r: Record<string, unknown>) => {
      const patient = r.patients as { patient_name: string } | null
      return [
        new Date(r.created_at as string).toLocaleDateString(),
        patient?.patient_name ?? '',
        r.status ?? '',
        r.sent_to_email ?? '',
        r.patient_submitted_at ? new Date(r.patient_submitted_at as string).toLocaleDateString() : '',
        r.staff_verified_at   ? new Date(r.staff_verified_at   as string).toLocaleDateString() : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    csv = [headers.join(','), ...lines].join('\n')
    filename = `insurance-${start}-${end}.csv`
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}