import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, TIER_PRICE_MAP } from '@/lib/stripe'

/**
 * Practice owner initiates their own subscription checkout.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, practice_id')
    .eq('id', user.id)
    .single()

  if (!profile?.practice_id) return NextResponse.json({ error: 'No practice' }, { status: 400 })
  if (!['practice_owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { tier } = await request.json()
  const priceId  = TIER_PRICE_MAP[tier ?? 'starter']

  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const service = createServiceClient()
  const { data: practice } = await service
    .from('practices')
    .select('name, email, stripe_customer_id, subscription_status')
    .eq('id', profile.practice_id)
    .single()

  if (!practice) return NextResponse.json({ error: 'Practice not found' }, { status: 404 })

  // Already has an active subscription — redirect to portal instead
  if (practice.subscription_status === 'active' && practice.stripe_customer_id) {
    return NextResponse.json({ redirect_to_portal: true })
  }

  let customerId = practice.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name:     practice.name,
      email:    practice.email ?? undefined,
      metadata: { practice_id: profile.practice_id },
    })
    customerId = customer.id
    await service.from('practices').update({ stripe_customer_id: customerId }).eq('id', profile.practice_id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata:   { practice_id: profile.practice_id },
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url:  `${appUrl}/settings?billing=cancelled`,
    subscription_data: {
      metadata: { practice_id: profile.practice_id },
      trial_period_days: 14,
    },
  })

  return NextResponse.json({ url: session.url })
}