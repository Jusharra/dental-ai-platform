import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getUserProfile()
  if (!profile?.practice_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await request.json() // 'activate' | 'pause' | 'complete'
  const supabase = createClient()

  // Verify campaign belongs to this practice
  const { data: campaign } = await supabase
    .from('recall_campaigns')
    .select('id, status, target_recall_months, practice_id')
    .eq('id', params.id)
    .eq('practice_id', profile.practice_id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'activate') {
    // Find patients due for recall (recall_due_date <= today OR last visit >= target months ago)
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - campaign.target_recall_months)
    const cutoff = cutoffDate.toISOString().split('T')[0]

    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .eq('practice_id', profile.practice_id)
      .is('deleted_at', null)
      .or(`recall_due_date.lte.${new Date().toISOString().split('T')[0]},last_visit_date.lte.${cutoff}`)

    const patientList = patients ?? []

    // Upsert into recall_campaign_patients (skip already-added)
    if (patientList.length > 0) {
      await supabase.from('recall_campaign_patients').upsert(
        patientList.map(p => ({
          campaign_id: params.id,
          patient_id:  p.id,
          contact_status: 'pending',
        })),
        { onConflict: 'campaign_id,patient_id', ignoreDuplicates: true }
      )
    }

    await supabase.from('recall_campaigns').update({
      status:         'active',
      started_at:     new Date().toISOString(),
      total_patients: patientList.length,
    }).eq('id', params.id)

    return NextResponse.json({ success: true, patients_added: patientList.length })
  }

  if (action === 'pause') {
    await supabase.from('recall_campaigns').update({ status: 'paused' }).eq('id', params.id)
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    await supabase.from('recall_campaigns').update({
      status:       'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', params.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
