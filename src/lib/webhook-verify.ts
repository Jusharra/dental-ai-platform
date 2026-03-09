import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export type WebhookFeature = 'inbound' | 'recall' | 'confirmation'

/**
 * Feature entitlement per subscription tier.
 * Easy to update — just add/remove features per tier here.
 */
export const TIER_FEATURES: Record<string, WebhookFeature[]> = {
  starter:      ['inbound'],
  professional: ['inbound', 'recall', 'confirmation'],
  enterprise:   ['inbound', 'recall', 'confirmation'],
}

type Practice = {
  id: string
  name: string
  subscription_tier: string
  subscription_status: string
}

type VerifySuccess = { ok: true; practice: Practice }
type VerifyError   = { ok: false; status: number; error: string; code: string }
export type VerifyResult = VerifySuccess | VerifyError

/**
 * Verifies an incoming Make.com → platform webhook request.
 *
 * Expected headers from Make.com:
 *   x-practice-id      — practice UUID  (or fall back to body field)
 *   x-webhook-secret   — that practice's webhook_secret from DB
 *   x-timestamp        — Unix timestamp in seconds (optional, enables replay protection)
 *
 * Steps:
 *  1. Extract practice_id (header first, body fallback)
 *  2. Load practice + webhook_secret from DB
 *  3. Compare secret
 *  4. Check timestamp freshness (if provided) — rejects if > 5 min old
 *  5. Check subscription is active/trial
 *  6. Check feature is allowed on this tier
 *  7. Write audit log entry (accepted or rejected with reason)
 */
export async function verifyWebhook(
  req: NextRequest,
  feature: WebhookFeature,
  bodyPracticeId?: string,
): Promise<VerifyResult> {
  const secret     = req.headers.get('x-webhook-secret')
  const tsHeader   = req.headers.get('x-timestamp')
  const practiceId = req.headers.get('x-practice-id') ?? bodyPracticeId
  const ip         = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  if (!secret || !practiceId) {
    return {
      ok: false, status: 401,
      error: 'Missing required headers: x-practice-id, x-webhook-secret',
      code: 'missing_headers',
    }
  }

  // Replay attack prevention — reject if timestamp > 5 minutes off
  if (tsHeader) {
    const ageMs = Date.now() - (parseInt(tsHeader, 10) * 1000)
    if (Math.abs(ageMs) > 5 * 60 * 1000) {
      return {
        ok: false, status: 401,
        error: 'Request timestamp is outside the 5-minute tolerance window',
        code: 'replay_detected',
      }
    }
  }

  const service = createServiceClient()

  const { data: practice } = await service
    .from('practices')
    .select('id, name, subscription_tier, subscription_status, webhook_secret')
    .eq('id', practiceId)
    .single()

  if (!practice) {
    await writeAuditLog(service, practiceId, feature, false, 'practice_not_found', ip)
    return { ok: false, status: 401, error: 'Practice not found', code: 'practice_not_found' }
  }

  if (practice.webhook_secret !== secret) {
    await writeAuditLog(service, practice.id, feature, false, 'invalid_secret', ip)
    return { ok: false, status: 401, error: 'Invalid webhook secret', code: 'invalid_secret' }
  }

  if (practice.subscription_status !== 'active' && practice.subscription_status !== 'trial') {
    await writeAuditLog(service, practice.id, feature, false, 'subscription_inactive', ip)
    return {
      ok: false, status: 403,
      error: 'Practice subscription is not active',
      code: 'subscription_inactive',
    }
  }

  const allowed = TIER_FEATURES[practice.subscription_tier] ?? []
  if (!allowed.includes(feature)) {
    await writeAuditLog(service, practice.id, feature, false, 'feature_not_enabled', ip)
    return {
      ok: false, status: 403,
      error: `Feature '${feature}' is not included in the ${practice.subscription_tier} plan`,
      code: 'feature_not_enabled',
    }
  }

  await writeAuditLog(service, practice.id, feature, true, null, ip)
  return {
    ok: true,
    practice: {
      id: practice.id,
      name: practice.name,
      subscription_tier: practice.subscription_tier,
      subscription_status: practice.subscription_status,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeAuditLog(service: any, practiceId: string, eventType: string, accepted: boolean, rejectionReason: string | null, ipAddress: string | null) {
  await service.from('webhook_audit_logs').insert({
    practice_id:      practiceId,
    event_type:       eventType,
    accepted,
    rejection_reason: rejectionReason,
    ip_address:       ipAddress,
  }).then(() => {}) // fire and forget — don't block the webhook response
}
