import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: verification } = await service
    .from('insurance_verifications')
    .select('id, status, token_expires_at, patient_id, patients(patient_name, email)')
    .eq('token', token)
    .single()

  if (!verification) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  if (verification.status === 'expired' || verification.status === 'verified') {
    return NextResponse.json({ error: 'This link has already been used or has expired.' }, { status: 410 })
  }

  const expired = new Date(verification.token_expires_at) < new Date()
  if (expired) {
    await service
      .from('insurance_verifications')
      .update({ status: 'expired' })
      .eq('id', verification.id)
    return NextResponse.json({ error: 'This link has expired. Please contact your dental office for a new link.' }, { status: 410 })
  }

  const patient = verification.patients as unknown as { patient_name: string; email: string | null } | null

  return NextResponse.json({
    valid: true,
    verification_id: verification.id,
    patient_name: patient?.patient_name ?? '',
    status: verification.status,
  })
}
