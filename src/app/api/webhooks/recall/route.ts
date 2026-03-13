import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

/**
 * Verifies the x-retell-signature header using HMAC-SHA256
 * with the RETELL_API_KEY as the secret.
 */
function verifyRetellSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.RETELL_API_KEY) return false
  const hmac = createHmac('sha256', process.env.RETELL_API_KEY)
  hmac.update(rawBody)
  return hmac.digest('base64') === signature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    if (!verifyRetellSignature(rawBody, request.headers.get('x-retell-signature'))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // Only process call_analyzed — this is when full analysis data is available
    if (body.event !== 'call_analyzed') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const call        = body.call ?? {}
    const vars        = call.retell_llm_dynamic_variables ?? {}
    const analysis    = call.call_analysis ?? {}
    const customData  = analysis.custom_analysis_data ?? {}

    const practice_id  = vars.practice_id
    const patient_id   = vars.patient_id   ?? null
    const campaign_id  = vars.campaign_id  ?? null
    const patient_phone = vars.patient_phone ?? call.to_number ?? ''

    if (!practice_id) {
      return NextResponse.json({ error: 'Missing practice_id in dynamic variables' }, { status: 400 })
    }

    // Derive call_outcome from Retell analysis
    let call_outcome: string
    if (analysis.call_successful) {
      call_outcome = 'appointment_booked'
    } else if (analysis.in_voicemail) {
      call_outcome = 'voicemail'
    } else {
      call_outcome = 'no_answer'
    }

    const retellCostCents = call.call_cost?.combined_cost
      ? Math.round(call.call_cost.combined_cost * 100)
      : 0
    const call_duration = call.duration_ms ? Math.round(call.duration_ms / 1000) : null

    const supabase = createServiceClient()

    // Create appointment if booked
    let appointmentId = null
    if (call_outcome === 'appointment_booked' && patient_id && customData.appointment_date) {
      const { data: appointment } = await supabase
        .from('appointments')
        .insert({
          practice_id,
          patient_id,
          provider_name:        customData.provider_name || 'TBD',
          appointment_date:     customData.appointment_date,
          appointment_time:     customData.appointment_time || '09:00:00',
          status:               'scheduled',
          confirmation_status:  'pending',
          procedure_type:       'cleaning',
        })
        .select('id')
        .single()

      appointmentId = appointment?.id ?? null
    }

    // Log the call
    await supabase.from('call_logs').insert({
      practice_id,
      patient_id:            patient_id,
      appointment_id:        appointmentId,
      retell_call_id:        call.call_id,
      call_type:             'recall',
      phone_number:          patient_phone,
      call_date:             new Date().toISOString().split('T')[0],
      call_time:             new Date().toTimeString().split(' ')[0],
      call_duration_seconds: call_duration,
      call_outcome,
      retell_cost_cents:     retellCostCents,
      transcript:            call.transcript    ?? null,
      recording_url:         call.recording_url ?? null,
      summary:               analysis.call_summary ?? null,
      agent_type:            'recall_agent',
    })

    // Update recall campaign stats
    if (campaign_id) {
      const isBooked = call_outcome === 'appointment_booked'
      await supabase.rpc('increment_campaign_contacted', { cid: campaign_id })
      if (isBooked) await supabase.rpc('increment_campaign_booked', { cid: campaign_id })

      if (patient_id) {
        await supabase
          .from('recall_campaign_patients')
          .update({
            contact_status:        isBooked ? 'booked' : 'contacted',
            last_contact_attempt:  new Date().toISOString(),
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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Recall webhook error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
