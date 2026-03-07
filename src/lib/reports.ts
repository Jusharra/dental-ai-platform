export type ReportType = 'call_performance' | 'confirmation' | 'recall' | 'insurance' | 'executive'

export type CallPerformanceData = {
  total_calls: number
  total_duration_seconds: number
  total_cost_cents: number
  avg_duration_seconds: number
  by_type: Record<string, { count: number; duration_s: number; cost_cents: number }>
  by_outcome: Record<string, number>
  by_day: { date: string; count: number; cost_cents: number }[]
}

export type ConfirmationData = {
  total_outbound: number
  confirmed: number
  declined: number
  no_response: number
  confirmation_rate: number
  by_type: { type: string; sent: number; confirmed: number; rate: number }[]
}

export type RecallData = {
  total_recall_calls: number
  appointments_booked: number
  reactivation_rate: number
  no_answer: number
  voicemail: number
  unique_patients_contacted: number
}

export type InsuranceData = {
  forms_sent: number
  patient_submitted: number
  staff_verified: number
  expired: number
  pending_patient: number
  pending_staff: number
  completion_rate: number
}

export type ExecutiveData = {
  call_performance: CallPerformanceData
  confirmation: ConfirmationData
  recall: RecallData
  insurance: InsuranceData
  practice_name: string
  date_range: { start: string; end: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildReport(service: any, type: ReportType, practiceId: string, start: string, end: string) {
  if (type === 'executive') {
    const [cp, conf, rec, ins, practice] = await Promise.all([
      buildCallPerformance(service, practiceId, start, end),
      buildConfirmation(service, practiceId, start, end),
      buildRecall(service, practiceId, start, end),
      buildInsurance(service, practiceId, start, end),
      service.from('practices').select('name').eq('id', practiceId).single(),
    ])
    return {
      call_performance: cp,
      confirmation: conf,
      recall: rec,
      insurance: ins,
      practice_name: practice.data?.name ?? '',
      date_range: { start, end },
    } satisfies ExecutiveData
  }
  if (type === 'call_performance') return buildCallPerformance(service, practiceId, start, end)
  if (type === 'confirmation')    return buildConfirmation(service, practiceId, start, end)
  if (type === 'recall')          return buildRecall(service, practiceId, start, end)
  if (type === 'insurance')       return buildInsurance(service, practiceId, start, end)
  throw new Error(`Unknown report type: ${type}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildCallPerformance(service: any, practiceId: string, start: string, end: string): Promise<CallPerformanceData> {
  const { data: calls } = await service
    .from('call_logs')
    .select('call_type, call_outcome, call_duration_seconds, retell_cost_cents, call_date')
    .eq('practice_id', practiceId)
    .gte('call_date', start)
    .lte('call_date', end)

  const rows = calls ?? []
  const total_duration_seconds = rows.reduce((s: number, r: { call_duration_seconds: number | null }) => s + (r.call_duration_seconds ?? 0), 0)
  const total_cost_cents = rows.reduce((s: number, r: { retell_cost_cents: number }) => s + (r.retell_cost_cents ?? 0), 0)

  const by_type: Record<string, { count: number; duration_s: number; cost_cents: number }> = {}
  const by_outcome: Record<string, number> = {}
  const by_day_map: Record<string, { count: number; cost_cents: number }> = {}

  for (const r of rows) {
    const t = r.call_type ?? 'unknown'
    if (!by_type[t]) by_type[t] = { count: 0, duration_s: 0, cost_cents: 0 }
    by_type[t].count++
    by_type[t].duration_s += r.call_duration_seconds ?? 0
    by_type[t].cost_cents += r.retell_cost_cents ?? 0

    const o = r.call_outcome ?? 'other'
    by_outcome[o] = (by_outcome[o] ?? 0) + 1

    const d = r.call_date as string
    if (!by_day_map[d]) by_day_map[d] = { count: 0, cost_cents: 0 }
    by_day_map[d].count++
    by_day_map[d].cost_cents += r.retell_cost_cents ?? 0
  }

  const by_day = Object.entries(by_day_map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  return {
    total_calls: rows.length,
    total_duration_seconds,
    total_cost_cents,
    avg_duration_seconds: rows.length ? Math.round(total_duration_seconds / rows.length) : 0,
    by_type,
    by_outcome,
    by_day,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildConfirmation(service: any, practiceId: string, start: string, end: string): Promise<ConfirmationData> {
  const confirmationTypes = ['confirmation_7day', 'confirmation_3day', 'confirmation_1day', 'reminder_3hour']

  const { data: calls } = await service
    .from('call_logs')
    .select('call_type, call_outcome')
    .eq('practice_id', practiceId)
    .in('call_type', confirmationTypes)
    .gte('call_date', start)
    .lte('call_date', end)

  const rows = calls ?? []
  let confirmed = 0, declined = 0, no_response = 0
  const by_type_map: Record<string, { sent: number; confirmed: number }> = {}

  for (const r of rows) {
    const t = r.call_type as string
    if (!by_type_map[t]) by_type_map[t] = { sent: 0, confirmed: 0 }
    by_type_map[t].sent++

    if (r.call_outcome === 'appointment_confirmed') {
      confirmed++
      by_type_map[t].confirmed++
    } else if (r.call_outcome === 'appointment_declined') {
      declined++
    } else {
      no_response++
    }
  }

  const by_type = Object.entries(by_type_map).map(([type, v]) => ({
    type,
    sent: v.sent,
    confirmed: v.confirmed,
    rate: v.sent ? Math.round((v.confirmed / v.sent) * 100) : 0,
  }))

  return {
    total_outbound: rows.length,
    confirmed,
    declined,
    no_response,
    confirmation_rate: rows.length ? Math.round((confirmed / rows.length) * 100) : 0,
    by_type,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildRecall(service: any, practiceId: string, start: string, end: string): Promise<RecallData> {
  const { data: calls } = await service
    .from('call_logs')
    .select('call_outcome, patient_id')
    .eq('practice_id', practiceId)
    .eq('call_type', 'recall')
    .gte('call_date', start)
    .lte('call_date', end)

  const rows = calls ?? []
  let appointments_booked = 0, no_answer = 0, voicemail = 0
  const patientIds = new Set<string>()

  for (const r of rows) {
    if (r.patient_id) patientIds.add(r.patient_id)
    if (r.call_outcome === 'appointment_booked') appointments_booked++
    else if (r.call_outcome === 'no_answer') no_answer++
    else if (r.call_outcome === 'voicemail') voicemail++
  }

  return {
    total_recall_calls: rows.length,
    appointments_booked,
    reactivation_rate: rows.length ? Math.round((appointments_booked / rows.length) * 100) : 0,
    no_answer,
    voicemail,
    unique_patients_contacted: patientIds.size,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildInsurance(service: any, practiceId: string, start: string, end: string): Promise<InsuranceData> {
  const { data: rows } = await service
    .from('insurance_verifications')
    .select('status')
    .eq('practice_id', practiceId)
    .gte('created_at', start)
    .lte('created_at', end + 'T23:59:59')

  const counts = { pending_patient: 0, pending_staff: 0, verified: 0, expired: 0 }
  for (const r of rows ?? []) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++
  }

  const forms_sent = (rows ?? []).length
  const patient_submitted = counts.pending_staff + counts.verified
  const completion_rate = forms_sent ? Math.round((counts.verified / forms_sent) * 100) : 0

  return {
    forms_sent,
    patient_submitted,
    staff_verified: counts.verified,
    expired: counts.expired,
    pending_patient: counts.pending_patient,
    pending_staff: counts.pending_staff,
    completion_rate,
  }
}
