import { NextRequest, NextResponse } from 'next/server'
import { stripe, priceIdToTier, stripeStatusToDb } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Required: disable body parsing so we can verify the Stripe signature
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = createServiceClient()

  try {
    switch (event.type) {
      // ── Checkout completed → link customer + subscription to practice ──────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const practiceId = session.metadata?.practice_id
        if (!practiceId || !session.customer || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ['items.data.price'] }
        )
        const priceId = subscription.items.data[0]?.price.id
        const tier    = priceId ? priceIdToTier(priceId) : null

        await service.from('practices').update({
          stripe_customer_id:      session.customer as string,
          stripe_subscription_id:  session.subscription as string,
          subscription_status:     stripeStatusToDb(subscription.status),
          ...(tier ? { subscription_tier: tier } : {}),
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        }).eq('id', practiceId)

        // Audit log
        await service.from('audit_logs').insert({
          practice_id:   practiceId,
          action:        'update',
          resource_type: 'subscription',
          resource_id:   session.subscription as string,
          changes: { event: 'checkout.session.completed', tier, status: subscription.status },
        })
        break
      }

      // ── Subscription updated (tier change, renewal, trial end) ─────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const tier    = priceId ? priceIdToTier(priceId) : null

        const { data: practice } = await service
          .from('practices')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!practice) break

        await service.from('practices').update({
          subscription_status: stripeStatusToDb(sub.status),
          ...(tier ? { subscription_tier: tier } : {}),
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        }).eq('id', practice.id)
        break
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: practice } = await service
          .from('practices')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!practice) break

        await service.from('practices').update({
          subscription_status:    'cancelled',
          stripe_subscription_id: null,
        }).eq('id', practice.id)
        break
      }

      // ── Payment failed → suspend practice ─────────────────────────────────
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        if (!invoice.subscription) break

        const { data: practice } = await service
          .from('practices')
          .select('id, email, name')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single()

        if (!practice) break

        await service.from('practices').update({
          subscription_status: 'suspended',
        }).eq('id', practice.id)
        break
      }

      // ── Payment succeeded → ensure active ────────────────────────────────
      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        if (!invoice.subscription || invoice.billing_reason === 'subscription_create') break

        const { data: practice } = await service
          .from('practices')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single()

        if (practice) {
          await service.from('practices').update({
            subscription_status: 'active',
          }).eq('id', practice.id)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}