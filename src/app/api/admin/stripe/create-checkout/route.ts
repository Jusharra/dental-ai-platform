import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, TIER_PRICE_MAP } from '@/lib/stripe'

/**
 * Admin creates a Stripe Checkout session for a practice.
 * Returns a checkout URL that can be sent to the practice owner.
 */
export async function POST(request: NextRequest) {
  // Must be super_admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { practice_id, tier } = await request.json()

  if (!practice_id || !tier) {
    return NextResponse.json({ error: 'practice_id and tier required' }, { status: 400 })
  }

  const priceId = TIER_PRICE_MAP[tier]
  if (!priceId) {
    return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: practice } = await service
    .from('practices')
    .select('name, email, stripe_customer_id')
    .eq('id', practice_id)
    .single()

  if (!practice) return NextResponse.json({ error: 'Practice not found' }, { status: 404 })

  // Create or reuse Stripe customer
  let customerId = practice.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name:     practice.name,
      email:    practice.email ?? undefined,
      metadata: { practice_id },
    })
    customerId = customer.id
    await service.from('practices').update({ stripe_customer_id: customerId }).eq('id', practice_id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata:   { practice_id },
    success_url: `${appUrl}/admin/practices/${practice_id}?billing=success`,
    cancel_url:  `${appUrl}/admin/practices/${practice_id}?billing=cancelled`,
    subscription_data: {
      metadata:   { practice_id },
      trial_period_days: 14,
    },
  })

  // Audit log
  await service.from('audit_logs').insert({
    user_id:       user.id,
    action:        'create',
    resource_type: 'stripe_checkout',
    resource_id:   session.id,
    changes: { practice_id, tier, url: session.url },
  })

  return NextResponse.json({ url: session.url })
}