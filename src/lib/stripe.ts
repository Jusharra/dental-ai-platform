import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Tier → Stripe Price ID mapping (set these in your .env.local)
export const TIER_PRICE_MAP: Record<string, string> = {
  starter:      process.env.STRIPE_PRICE_STARTER!,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
  enterprise:   process.env.STRIPE_PRICE_ENTERPRISE!,
}

// Stripe Price ID → tier name (reverse map, built at runtime)
export function priceIdToTier(priceId: string): string | null {
  for (const [tier, pid] of Object.entries(TIER_PRICE_MAP)) {
    if (pid === priceId) return tier
  }
  return null
}

// Stripe subscription status → our DB status
export function stripeStatusToDb(
  status: Stripe.Subscription.Status,
): 'trial' | 'active' | 'cancelled' | 'suspended' {
  switch (status) {
    case 'trialing':  return 'trial'
    case 'active':    return 'active'
    case 'canceled':  return 'cancelled'
    case 'past_due':
    case 'unpaid':
    case 'paused':    return 'suspended'
    default:          return 'suspended'
  }
}