import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Require authenticated staff
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { patient_id, email } = await request.json()

    if (!patient_id || !email) {
      return NextResponse.json({ error: 'patient_id and email are required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Fetch patient + practice
    const { data: patient } = await service
      .from('patients')
      .select('id, patient_name, practice_id')
      .eq('id', patient_id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Fetch practice name for email
    const { data: practice } = await service
      .from('practices')
      .select('name')
      .eq('id', patient.practice_id)
      .single()

    // Generate secure token (48 hex chars)
    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Expire any existing pending_patient verifications for this patient
    await service
      .from('insurance_verifications')
      .update({ status: 'expired' })
      .eq('patient_id', patient_id)
      .eq('status', 'pending_patient')

    // Create new verification record
    const { data: verification, error: insertError } = await service
      .from('insurance_verifications')
      .insert({
        practice_id: patient.practice_id,
        patient_id,
        token,
        token_expires_at: expiresAt.toISOString(),
        status: 'pending_patient',
        sent_to_email: email,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create verification' }, { status: 500 })
    }

    const practiceDisplayName = practice?.name ?? 'Your Dental Practice'
    const formUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-insurance?token=${token}`

    // Send email via Resend
    const { error: emailError } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@firstchoicecyber.com',
      to: email,
      subject: `Insurance Verification Request — ${practiceDisplayName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1e293b; background: #fff;">
            <div style="margin-bottom: 32px;">
              <div style="font-size: 22px; font-weight: 700; color: #0f172a;">${practiceDisplayName}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Insurance Verification Request</div>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi ${patient.patient_name},</p>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              We&apos;d like to verify your dental insurance before your upcoming appointment.
              Please take a few minutes to complete our secure insurance verification form.
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              You&apos;ll need to have your insurance card ready. The form only takes about 3–5 minutes.
            </p>

            <div style="text-align: center; margin: 36px 0;">
              <a href="${formUrl}" style="display: inline-block; background: #f97316; color: #fff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
                Complete Insurance Verification
              </a>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #64748b;">
              <strong style="color: #475569;">This link expires in 7 days.</strong><br/>
              If you did not expect this email, please contact our office directly.
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
              This is a secure, HIPAA-compliant form. Your information is encrypted and used only for insurance verification purposes.
            </p>

            <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #94a3b8;">
              ${practiceDisplayName} · Powered by Dental AI Growth System
            </div>
          </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Email error:', emailError)
      // Still return success — the record was created; staff can resend
      return NextResponse.json({
        success: true,
        warning: 'Verification created but email delivery failed. Check RESEND_API_KEY.',
        verification_id: verification.id,
      })
    }

    return NextResponse.json({ success: true, verification_id: verification.id })
  } catch (err) {
    console.error('send-form error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
