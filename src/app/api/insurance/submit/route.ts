import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const token = formData.get('token') as string
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Validate token
    const { data: verification } = await service
      .from('insurance_verifications')
      .select('id, status, token_expires_at, patient_id, practice_id')
      .eq('token', token)
      .single()

    if (!verification) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (verification.status !== 'pending_patient') {
      return NextResponse.json({ error: 'This form has already been submitted.' }, { status: 409 })
    }

    if (new Date(verification.token_expires_at) < new Date()) {
      await service
        .from('insurance_verifications')
        .update({ status: 'expired' })
        .eq('id', verification.id)
      return NextResponse.json({ error: 'This link has expired.' }, { status: 410 })
    }

    // Upload card photos to Supabase Storage
    let cardFrontUrl: string | null = null
    let cardBackUrl: string | null = null

    const cardFront = formData.get('card_front') as File | null
    const cardBack = formData.get('card_back') as File | null

    if (cardFront && cardFront.size > 0) {
      const frontBuffer = Buffer.from(await cardFront.arrayBuffer())
      const frontPath = `${verification.practice_id}/${verification.patient_id}/${verification.id}/front_${Date.now()}`
      const { error: uploadError } = await service.storage
        .from('insurance-cards')
        .upload(frontPath, frontBuffer, {
          contentType: cardFront.type,
          upsert: true,
        })
      if (!uploadError) {
        const { data: urlData } = service.storage
          .from('insurance-cards')
          .getPublicUrl(frontPath)
        cardFrontUrl = urlData.publicUrl
      }
    }

    if (cardBack && cardBack.size > 0) {
      const backBuffer = Buffer.from(await cardBack.arrayBuffer())
      const backPath = `${verification.practice_id}/${verification.patient_id}/${verification.id}/back_${Date.now()}`
      const { error: uploadError } = await service.storage
        .from('insurance-cards')
        .upload(backPath, backBuffer, {
          contentType: cardBack.type,
          upsert: true,
        })
      if (!uploadError) {
        const { data: urlData } = service.storage
          .from('insurance-cards')
          .getPublicUrl(backPath)
        cardBackUrl = urlData.publicUrl
      }
    }

    // Extract form fields
    const subscriberName        = formData.get('subscriber_name') as string | null
    const subscriberDob         = formData.get('subscriber_dob') as string | null
    const subscriberRelationship = formData.get('subscriber_relationship') as string | null
    const insuranceCarrier      = formData.get('insurance_carrier') as string | null
    const memberId              = formData.get('member_id') as string | null
    const groupNumber           = formData.get('group_number') as string | null

    // Update insurance_verifications record
    const { error: updateError } = await service
      .from('insurance_verifications')
      .update({
        status: 'pending_staff',
        p_subscriber_name: subscriberName,
        p_subscriber_dob: subscriberDob || null,
        p_subscriber_relationship: subscriberRelationship,
        p_insurance_carrier: insuranceCarrier,
        p_member_id: memberId,
        p_group_number: groupNumber,
        p_card_front_url: cardFrontUrl,
        p_card_back_url: cardBackUrl,
        patient_submitted_at: new Date().toISOString(),
      })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save form' }, { status: 500 })
    }

    // Also update the patient's basic insurance fields for quick reference
    await service
      .from('patients')
      .update({
        insurance_provider: insuranceCarrier,
        insurance_id: memberId,
        insurance_group: groupNumber,
        subscriber_name: subscriberName,
        subscriber_dob: subscriberDob || null,
        subscriber_relationship: subscriberRelationship,
      })
      .eq('id', verification.patient_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
