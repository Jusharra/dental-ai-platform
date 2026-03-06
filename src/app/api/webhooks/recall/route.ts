import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createServiceClient()

    const {
      call_id,
      practice_id,
      patient_id,
      campaign_id,
      call_outcome,
      appointment_date,
      appointment_time,
      provider_name,
      transcript,
      recording_url,
      call_duration,
      call_cost,
    } = body

    const retellCostCents = call_cost ? Math.round(call_cost * 100) : 0

    if (!practice_id || !call_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let appointmentId = null

    // If appointment was booked, create it
    if (call_outcome === 'appointment_scheduled' || call_outcome === 'appointment_booked') {
      if (patient_id && appointment_date) {
        const { data: appointment } = await supabase
          .from('appointments')
          .insert({
            practice_id,
            patient_id,
            provider_name: provider_name || 'TBD',
            appointment_date,
            appointment_time: appointment_time || '09:00',
            status: 'scheduled',
            confirmation_status: 'pending',
            procedure_type: 'cleaning',
          })
          .select('id')
          .single()

        appointmentId = appointment?.id
      }
    }

    // Create call log
    await supabase.from('call_logs').insert({
      practice_id,
      patient_id: patient_id || null,
      appointment_id: appointmentId,
      retell_call_id: call_id,
      call_type: 'recall',
      phone_number: body.patient_phone || '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().split(' ')[0],
      call_duration_seconds: call_duration || null,
      call_outcome: call_outcome === 'appointment_scheduled' ? 'appointment_booked' : call_outcome,
      retell_cost_cents: retellCostCents,
      transcript: transcript || null,
      recording_url: recording_url || null,
      agent_type: 'recall_agent',
    })

    // Update recall campaign stats if campaign_id provided
    if (campaign_id) {
      await supabase.rpc('increment_campaign_contacted', { cid: campaign_id })

      if (patient_id) {
        await supabase
          .from('recall_campaign_patients')
          .update({
            contact_status: call_outcome === 'appointment_scheduled' ? 'booked' : 'contacted',
            last_contact_attempt: new Date().toISOString(),
            booked_appointment_id: appointmentId,
          })
          .eq('campaign_id', campaign_id)
          .eq('patient_id', patient_id)
      }
    }

    // Update patient last_contact_date
    if (patient_id) {
      await supabase
        .from('patients')
        .update({ last_contact_date: new Date().toISOString().split('T')[0] })
        .eq('id', patient_id)
    }

    return NextResponse.json({
      success: true,
      appointment_id: appointmentId,
    })
  } catch (error) {
    console.error('Recall webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
