import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyWebhook } from '@/lib/webhook-verify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Per-practice verification + subscription gating
    const result = await verifyWebhook(request, 'inbound', body.practice_id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
    }

    const { practice_id, patient_phone, patient_name, call_id, call_outcome,
            appointment_date, appointment_time, provider_name,
            transcript, recording_url, call_duration, call_cost } = body

    if (!practice_id || !patient_phone) {
      return NextResponse.json({ error: 'Missing required fields: practice_id, patient_phone' }, { status: 400 })
    }

    const retellCostCents = call_cost ? Math.round(call_cost * 100) : 0
    const supabase = createServiceClient()

    // Find or create patient
    let patient
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone', patient_phone)
      .eq('practice_id', practice_id)
      .single()

    if (existingPatient) {
      await supabase
        .from('patients')
        .update({ last_contact_date: new Date().toISOString().split('T')[0] })
        .eq('id', existingPatient.id)
      patient = existingPatient
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          practice_id,
          patient_name: patient_name || 'Unknown',
          phone: patient_phone,
          status: 'active',
          last_contact_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single()

      if (patientError) {
        return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
      }
      patient = newPatient
    }

    // Create appointment if booked
    let appointmentId = null
    if (call_outcome === 'appointment_booked' && patient && appointment_date) {
      const { data: appointment } = await supabase
        .from('appointments')
        .insert({
          practice_id,
          patient_id: patient.id,
          provider_name: provider_name || 'TBD',
          appointment_date,
          appointment_time: appointment_time || '00:00:00',
          duration_minutes: 60,
          procedure_type: 'general',
          status: 'scheduled',
          confirmation_status: 'pending',
        })
        .select('id')
        .single()

      appointmentId = appointment?.id ?? null
    }

    // Log the call
    await supabase.from('call_logs').insert({
      practice_id,
      patient_id:            patient?.id,
      appointment_id:        appointmentId,
      call_type:             'inbound',
      retell_call_id:        call_id,
      phone_number:          patient_phone,
      call_date:             new Date().toISOString().split('T')[0],
      call_time:             new Date().toISOString().split('T')[1].split('.')[0],
      call_duration_seconds: call_duration || 0,
      call_outcome:          call_outcome || 'other',
      retell_cost_cents:     retellCostCents,
      transcript:            transcript ?? null,
      recording_url:         recording_url ?? null,
      agent_type:            'inbound_receptionist',
    })

    return NextResponse.json({ success: true, patient_id: patient?.id, appointment_id: appointmentId })
  } catch (error) {
    console.error('Inbound webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
