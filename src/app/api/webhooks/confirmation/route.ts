import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyWebhook } from '@/lib/webhook-verify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Per-practice verification + subscription gating
    const result = await verifyWebhook(request, 'confirmation', body.practice_id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
    }

    const { call_id, practice_id, appointment_id, confirmation_status,
            call_outcome, transcript, recording_url,
            call_duration, call_type, call_cost } = body

    if (!practice_id || !call_id) {
      return NextResponse.json({ error: 'Missing required fields: practice_id, call_id' }, { status: 400 })
    }

    const retellCostCents = call_cost ? Math.round(call_cost * 100) : 0
    const supabase = createServiceClient()

    // Update appointment confirmation status
    if (appointment_id) {
      const confirmationMap: Record<string, string> = {
        confirmed:             'confirmed',
        appointment_confirmed: 'confirmed',
        declined:              'declined',
        appointment_declined:  'declined',
        no_answer:             'no_response',
        voicemail:             'no_response',
      }

      const mappedStatus = confirmationMap[confirmation_status || call_outcome] || 'no_response'

      await supabase
        .from('appointments')
        .update({
          confirmation_status: mappedStatus,
          confirmation_date:   new Date().toISOString(),
          confirmation_method: 'phone',
          ...(mappedStatus === 'confirmed' ? { status: 'confirmed' } : {}),
        })
        .eq('id', appointment_id)
    }

    // Get patient_id from appointment if not provided
    let patientId = body.patient_id || null
    if (!patientId && appointment_id) {
      const { data: apt } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('id', appointment_id)
        .single()
      patientId = apt?.patient_id
    }

    // Log the call
    await supabase.from('call_logs').insert({
      practice_id,
      patient_id:            patientId,
      appointment_id:        appointment_id || null,
      retell_call_id:        call_id,
      call_type:             call_type || 'confirmation_1day',
      phone_number:          body.patient_phone || '',
      call_date:             new Date().toISOString().split('T')[0],
      call_time:             new Date().toTimeString().split(' ')[0],
      call_duration_seconds: call_duration || null,
      call_outcome:          call_outcome || confirmation_status || null,
      retell_cost_cents:     retellCostCents,
      transcript:            transcript || null,
      recording_url:         recording_url || null,
      agent_type:            'confirmation_agent',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Confirmation webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
