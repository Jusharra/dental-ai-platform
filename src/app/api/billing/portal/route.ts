import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

/**
 * Returns a Stripe Customer Portal URL for the authenticated practice owner.
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, practice_id')
    .eq('id', user.id)
    .single()

  if (!profile?.practice_id) return NextResponse.json({ error: 'No practice' }, { status: 400 })

  const service = createServiceClient()
  const { data: practice } = await service
    .from('practices')
    .select('stripe_customer_id')
    .eq('id', profile.practice_id)
    .single()

  if (!practice?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer — subscribe first' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer:   practice.stripe_customer_id,
    return_url: `${appUrl}/settings`,
  })

  return NextResponse.json({ url: session.url })
}