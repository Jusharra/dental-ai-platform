'use client'

import { useState } from 'react'
import { RefreshCw, Check } from 'lucide-react'

type AdminSettings = {
  id: string
  platform_name:       string | null
  company_name:        string | null
  platform_url:        string | null
  support_email:       string | null
  platform_resend_key: string | null
  platform_from_email: string | null
  platform_from_name:  string | null
  calcom_api_key:      string | null
  calcom_event_type_id:string | null
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label, id, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-300 font-medium">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function AdminSettingsForm({ initial }: { initial: AdminSettings }) {
  const [saving, setSaving] = useState<string | null>(null)
  const [saved,  setSaved]  = useState<string | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  // Platform identity
  const [platformName, setPlatformName]   = useState(initial.platform_name  ?? 'Dental Patient Operations & Compliance Platform')
  const [companyName,  setCompanyName]    = useState(initial.company_name   ?? '')
  const [platformUrl,  setPlatformUrl]    = useState(initial.platform_url   ?? '')
  const [supportEmail, setSupportEmail]   = useState(initial.support_email  ?? '')

  // Platform email
  const [resendKey,    setResendKey]      = useState(initial.platform_resend_key  ?? '')
  const [fromEmail,    setFromEmail]      = useState(initial.platform_from_email  ?? '')
  const [fromName,     setFromName]       = useState(initial.platform_from_name   ?? '')

  // Cal.com
  const [calcomKey,    setCalcomKey]      = useState(initial.calcom_api_key       ?? '')
  const [calcomEvent,  setCalcomEvent]    = useState(initial.calcom_event_type_id ?? '')

  async function save(section: string, patch: Partial<AdminSettings>) {
    setSaving(section)
    setError(null)
    setSaved(null)
    try {
      const res  = await fetch('/api/admin/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: initial.id, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(section)
      setTimeout(() => setSaved(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  function SaveButton({ section }: { section: string }) {
    const isSaving = saving === section
    const isSaved  = saved  === section
    return (
      <button
        type="submit"
        disabled={!!saving}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
      >
        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isSaved ? <Check className="w-3.5 h-3.5" /> : null}
        {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save'}
      </button>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}

      {/* Platform identity */}
      <Section title="Platform Identity">
        <form
          onSubmit={e => { e.preventDefault(); save('identity', { platform_name: platformName, company_name: companyName, platform_url: platformUrl, support_email: supportEmail }) }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform Name"  id="platform_name"  value={platformName}  onChange={setPlatformName}  placeholder="Dental Patient Operations & Compliance Platform" />
            <Field label="Company Name"   id="company_name"   value={companyName}   onChange={setCompanyName}   placeholder="Your company name" />
          </div>
          <Field label="Platform URL"   id="platform_url"   value={platformUrl}   onChange={setPlatformUrl}   placeholder="https://your-app.vercel.app" type="url" />
          <Field label="Support Email"  id="support_email"  value={supportEmail}  onChange={setSupportEmail}  placeholder="support@yourcompany.com" type="email" />
          <SaveButton section="identity" />
        </form>
      </Section>

      {/* Platform email */}
      <Section title="Platform Email (Resend)">
        <p className="text-xs text-slate-500">Used for system emails sent from the platform (monthly reports, notifications). Separate from per-practice Resend keys.</p>
        <form
          onSubmit={e => { e.preventDefault(); save('email', { platform_resend_key: resendKey, platform_from_email: fromEmail, platform_from_name: fromName }) }}
          className="space-y-3"
        >
          <Field label="Resend API Key" id="resend_key"  value={resendKey}  onChange={setResendKey}  placeholder="re_xxxxxxxxxxxx" hint="Get from resend.com/api-keys" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Email"   id="from_email" value={fromEmail}  onChange={setFromEmail}  placeholder="noreply@yourdomain.com" type="email" />
            <Field label="From Name"    id="from_name"  value={fromName}   onChange={setFromName}   placeholder="Dental Patient Operations & Compliance Platform" />
          </div>
          <SaveButton section="email" />
        </form>
      </Section>

      {/* Cal.com */}
      <Section title="Cal.com Integration">
        <p className="text-xs text-slate-500">Used for booking demo appointments from the marketing site.</p>
        <form
          onSubmit={e => { e.preventDefault(); save('calcom', { calcom_api_key: calcomKey, calcom_event_type_id: calcomEvent }) }}
          className="space-y-3"
        >
          <Field label="Cal.com API Key"      id="calcom_key"   value={calcomKey}   onChange={setCalcomKey}   placeholder="cal_live_xxxxxxxxxxxx" hint="Get from cal.com/settings/developer/api-keys" />
          <Field label="Demo Event Type ID"   id="calcom_event" value={calcomEvent} onChange={setCalcomEvent} placeholder="123456" hint="The numeric ID of your demo booking event type" />
          <SaveButton section="calcom" />
        </form>
      </Section>
    </div>
  )
}