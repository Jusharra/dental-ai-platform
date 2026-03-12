import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, practiceName } = await request.json()

    if (!email || !password || !fullName || !practiceName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // 1. Create the practice
    const { data: practice, error: practiceError } = await serviceClient
      .from('practices')
      .insert({
        name: practiceName,
        subscription_tier: 'professional',
        subscription_status: 'trial',
      })
      .select()
      .single()

    if (practiceError) {
      console.error('Practice creation error:', practiceError)
      return NextResponse.json({ error: 'Failed to create practice' }, { status: 500 })
    }

    // 2. Create the auth user
    const { data: authData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        practice_id: practice.id,
        role: 'practice_owner',
      },
    })

    if (signUpError) {
      await serviceClient.from('practices').delete().eq('id', practice.id)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // 3. Explicitly upsert the user record — don't rely solely on the DB trigger
    const gracePeriodEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const { error: userError } = await serviceClient
      .from('users')
      .upsert({
        id: authData.user!.id,
        email,
        full_name: fullName,
        role: 'practice_owner',
        practice_id: practice.id,
        mfa_grace_period_ends: gracePeriodEnds,
      })

    if (userError) {
      console.error('User record error:', userError)
      // Non-fatal — trigger may have already created it
    }

    return NextResponse.json({
      success: true,
      practice_id: practice.id,
      user_id: authData.user?.id,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
