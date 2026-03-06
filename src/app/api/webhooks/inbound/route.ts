import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Inbound Call Webhook
 * 
 * Receives data from Make.com when an inbound call completes
 * 
 * Payload example:
 * {
 *   "call_id": "retell_abc123",
 *   "practice_id": "uuid",
 *   "patient_phone": "+1234567890",
 *   "patient_name": "John Doe",
 *   "call_duration": 180,
 *   "call_outcome": "appointment_booked",
 *   "appointment_date": "2026-03-15",
 *   "appointment_time": "10:00 AM",
 *   "provider_name": "Dr. Smith",
 *   "transcript": "Full call transcript...",
 *   "recording_url": "https://..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      console.error('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse payload
    const payload = await request.json()
    console.log('Inbound webhook received:', {
      call_id: payload.call_id,
      practice_id: payload.practice_id,
      outcome: payload.call_outcome,
    })

    // call_cost is in USD from Retell (e.g. 0.05 = 5 cents)
    const retellCostCents = payload.call_cost
      ? Math.round(payload.call_cost * 100)
      : 0

    // 3. Validate required fields
    if (!payload.practice_id || !payload.patient_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: practice_id, patient_phone' },
        { status: 400 }
      )
    }

    // 4. Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 5. Find or create patient
    let patient
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', payload.patient_phone)
      .eq('practice_id', payload.practice_id)
      .single()

    if (existingPatient) {
      // Update existing patient
      const { data: updatedPatient } = await supabase
        .from('patients')
        .update({
          last_contact_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', existingPatient.id)
        .select()
        .single()

      patient = updatedPatient
      console.log('Updated existing patient:', patient?.id)
    } else {
      // Create new patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          practice_id: payload.practice_id,
          patient_name: payload.patient_name || 'Unknown',
          phone: payload.patient_phone,
          status: 'active',
          last_contact_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (patientError) {
        console.error('Error creating patient:', patientError)
        return NextResponse.json(
          { error: 'Failed to create patient' },
          { status: 500 }
        )
      }

      patient = newPatient
      console.log('Created new patient:', patient?.id)
    }

    // 6. Create appointment if booked
    let appointmentId = null
    if (payload.call_outcome === 'appointment_booked' && patient) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          practice_id: payload.practice_id,
          patient_id: patient.id,
          provider_name: payload.provider_name || 'TBD',
          appointment_date: payload.appointment_date,
          appointment_time: payload.appointment_time || '00:00:00',
          duration_minutes: 60,
          procedure_type: 'general',
          status: 'scheduled',
          confirmation_status: 'pending',
        })
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
      } else {
        appointmentId = appointment?.id
        console.log('Created appointment:', appointmentId)
      }
    }

    // 7. Log the call
    const { error: logError } = await supabase.from('call_logs').insert({
      practice_id: payload.practice_id,
      patient_id: patient?.id,
      appointment_id: appointmentId,
      call_type: 'inbound',
      retell_call_id: payload.call_id,
      phone_number: payload.patient_phone,
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toISOString().split('T')[1].split('.')[0],
      call_duration_seconds: payload.call_duration || 0,
      call_outcome: payload.call_outcome || 'other',
      retell_cost_cents: retellCostCents,
      transcript: payload.transcript,
      recording_url: payload.recording_url,
      agent_type: 'inbound_receptionist',
    })

    if (logError) {
      console.error('Error logging call:', logError)
    } else {
      console.log('Call logged successfully')
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      patient_id: patient?.id,
      appointment_id: appointmentId,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
