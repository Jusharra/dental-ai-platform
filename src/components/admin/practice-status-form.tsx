'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Practice = {
  id: string
  name: string
  subscription_tier: string | null
  subscription_status: string
  trial_ends_at: string | null
  onboarding_status: string | null
  mrr: number | null
  notes: string | null
  source: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export function PracticeStatusForm({ practice }: { practice: Practice }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [tier,             setTier]            = useState(practice.subscription_tier ?? '')
  const [status,           setStatus]          = useState(practice.subscription_status)
  const [onboarding,       setOnboarding]      = useState(practice.onboarding_status ?? 'not_started')
  const [trialEnds,        setTrialEnds]        = useState(practice.trial_ends_at?.split('T')[0] ?? '')
  const [mrr,              setMrr]             = useState(practice.mrr != null ? String(practice.mrr) : '')
  const [notes,            setNotes]           = useState(practice.notes ?? '')
  const [source,           setSource]          = useState(practice.source ?? '')
  const [stripeCustomer,   setStripeCustomer]  = useState(practice.stripe_customer_id ?? '')
  const [stripeSub,        setStripeSub]       = useState(practice.stripe_subscription_id ?? '')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const { error } = await supabase
      .from('practices')
      .update({
        subscription_tier:    tier || null,
        subscription_status:  status,
        onboarding_status:    onboarding,
        trial_ends_at:        trialEnds || null,
        mrr:                  mrr ? parseFloat(mrr) : null,
        notes:                notes || null,
        source:               source || null,
        stripe_customer_id:   stripeCustomer || null,
        stripe_subscription_id: stripeSub || null,
      })
      .eq('id', practice.id)

    setSaving(false)
    setMsg(error ? `Error: ${error.message}` : 'Saved successfully')
    setTimeout(() => setMsg(null), 3000)
  }

  const inputCls = 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-orange-500'
  const selectCls = `w-full ${inputCls} border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`
  const labelCls = 'text-slate-300'

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-semibold text-white">Admin — Practice Settings</h3>

      {msg && (
        <p className={`text-xs px-3 py-2 rounded-lg ${msg.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
          {msg}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={labelCls}>Subscription Plan</Label>
          <select value={tier} onChange={e => setTier(e.target.value)} className={selectCls}>
            <option value="">— None —</option>
            <option value="starter">Serenity Capture</option>
            <option value="professional">Serenity Complete</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Subscription Status</Label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Onboarding Status</Label>
          <select value={onboarding} onChange={e => setOnboarding(e.target.value)} className={selectCls}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Trial Ends</Label>
          <Input type="date" value={trialEnds} onChange={e => setTrialEnds(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>MRR Override ($)</Label>
          <Input type="number" value={mrr} onChange={e => setMrr(e.target.value)} placeholder="Leave blank to use plan default" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Lead Source</Label>
          <Input value={source} onChange={e => setSource(e.target.value)} placeholder="website, referral, outbound…" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Stripe Customer ID</Label>
          <Input value={stripeCustomer} onChange={e => setStripeCustomer(e.target.value)} placeholder="cus_xxxxxxxxxx" className={`${inputCls} font-mono`} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Stripe Subscription ID</Label>
          <Input value={stripeSub} onChange={e => setStripeSub(e.target.value)} placeholder="sub_xxxxxxxxxx" className={`${inputCls} font-mono`} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={labelCls}>Internal Notes (FCG only)</Label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes visible only to First-Choice Cyber admins…"
          className={`w-full ${inputCls} border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none`}
        />
      </div>

      <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-400 text-white">
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}