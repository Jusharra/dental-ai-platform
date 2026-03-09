'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react'

const TIERS = [
  { value: 'starter',      label: 'Serenity Capture',   price: '$295/mo' },
  { value: 'professional', label: 'Serenity Complete',   price: '$495/mo' },
  { value: 'enterprise',   label: 'Serenity Enterprise', price: '$895/mo' },
]

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400',
  trial:     'bg-blue-500/15 text-blue-400',
  cancelled: 'bg-red-500/15 text-red-400',
  suspended: 'bg-yellow-500/15 text-yellow-400',
}

export function SubscriptionManager({
  practiceId,
  currentStatus,
  currentTier,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  practiceId:          string
  currentStatus:       string | null
  currentTier:         string | null
  stripeCustomerId:    string | null
  stripeSubscriptionId: string | null
}) {
  const [selectedTier, setSelectedTier] = useState(currentTier ?? 'starter')
  const [checkoutUrl, setCheckoutUrl]   = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [copied, setCopied]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function createCheckout() {
    setLoading(true)
    setError(null)
    setCheckoutUrl(null)
    try {
      const res = await fetch('/api/admin/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ practice_id: practiceId, tier: selectedTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCheckoutUrl(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create checkout')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!checkoutUrl) return
    await navigator.clipboard.writeText(checkoutUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasSubscription = !!stripeSubscriptionId
  const statusStyle = STATUS_STYLES[currentStatus ?? ''] ?? 'bg-slate-700 text-slate-400'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-orange-400" />
        <h3 className="font-semibold text-white">Subscription Management</h3>
      </div>

      {/* Current state */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Current Status</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>
            {currentStatus ?? 'None'}
          </span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Current Plan</p>
          <p className="text-sm font-medium text-white capitalize">
            {currentTier ?? 'Not set'}
          </p>
        </div>
        {stripeCustomerId && (
          <div className="bg-slate-800 rounded-lg p-3 col-span-2">
            <p className="text-xs text-slate-500 mb-1">Stripe Customer ID</p>
            <p className="text-xs font-mono text-slate-300">{stripeCustomerId}</p>
          </div>
        )}
        {stripeSubscriptionId && (
          <div className="bg-slate-800 rounded-lg p-3 col-span-2">
            <p className="text-xs text-slate-500 mb-1">Stripe Subscription ID</p>
            <p className="text-xs font-mono text-slate-300">{stripeSubscriptionId}</p>
          </div>
        )}
      </div>

      {/* Create / send checkout */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {hasSubscription ? 'Change Plan' : 'Create Subscription'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedTier(t.value)}
              className={`p-3 rounded-lg border text-left transition ${
                selectedTier === t.value
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <p className={`text-xs font-semibold ${selectedTier === t.value ? 'text-orange-400' : 'text-white'}`}>
                {t.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t.price}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={createCheckout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Generate Checkout Link'}
        </button>

        {checkoutUrl && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2">
            <p className="text-xs text-slate-400">Checkout link (14-day free trial included):</p>
            <p className="text-xs font-mono text-slate-300 break-all">{checkoutUrl}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}