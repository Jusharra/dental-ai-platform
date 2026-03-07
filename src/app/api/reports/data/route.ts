import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildReport, type ReportType } from '@/lib/reports'

export type { ReportType, CallPerformanceData, ConfirmationData, RecallData, InsuranceData, ExecutiveData } from '@/lib/reports'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ReportType
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const practiceIdParam = searchParams.get('practice_id')

  if (!type || !start || !end) {
    return NextResponse.json({ error: 'type, start, end are required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, practice_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let practiceId: string
  if (profile.role === 'super_admin' && practiceIdParam) {
    practiceId = practiceIdParam
  } else if (profile.practice_id) {
    practiceId = profile.practice_id
  } else {
    return NextResponse.json({ error: 'No practice context' }, { status: 400 })
  }

  const service = createServiceClient()

  try {
    const data = await buildReport(service, type, practiceId, start, end)
    return NextResponse.json(data)
  } catch (err) {
    console.error('Report error:', err)
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 })
  }
}
