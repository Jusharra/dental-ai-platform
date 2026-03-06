'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Copy, Check, Eye, EyeOff, ArrowRight, ArrowLeft, Bot,
  Plug, RefreshCw, CheckCircle, Circle, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── PMS catalogue ──────────────────────────────────────────────────────────────
const PMS_OPTIONS = [
  {
    id: 'dentrix',
    name: 'Dentrix',
    vendor: 'Henry Schein',
    logo: 'D',
    available: true,
    authType: 'api_key',
    helpText: 'Enter your Dentrix API credentials from Hub → Settings → API.',
    fields: [
      { key: 'api_url',      label: 'API Base URL',  placeholder: 'https://api.dentrixascend.com', type: 'url'  },
      { key: 'api_key',      label: 'API Key',        placeholder: 'dx_live_xxxxxxxxxxxx',          type: 'password' },
      { key: 'site_id',      label: 'Site / Office ID', placeholder: 'Your Dentrix site ID',       type: 'text' },
    ],
  },
  {
    id: 'eaglesoft',
    name: 'Eaglesoft',
    vendor: 'Patterson Dental',
    logo: 'E',
    available: true,
    authType: 'credentials',
    helpText: 'Contact Patterson support to enable API access, then enter the credentials below.',
    fields: [
      { key: 'api_url',      label: 'Server URL',       placeholder: 'http://your-server:8080', type: 'url'      },
      { key: 'api_username', label: 'Username',          placeholder: 'api_user',                type: 'text'     },
      { key: 'api_password', label: 'Password',          placeholder: '••••••••',                type: 'password' },
      { key: 'database',     label: 'Database Name',     placeholder: 'EagleSoft',               type: 'text'     },
    ],
  },
  {
    id: 'opendental',
    name: 'Open Dental',
    vendor: 'Open Dental Software',
    logo: 'OD',
    available: true,
    authType: 'api_key',
    helpText: 'Enable the API in Open Dental → Setup → API, then copy the developer key.',
    fields: [
      { key: 'api_url',    label: 'API URL',         placeholder: 'https://api.opendental.com/api/v1', type: 'url'      },
      { key: 'api_key',    label: 'Developer API Key', placeholder: 'od_live_xxxxxxxx',                type: 'password' },
      { key: 'customer_key', label: 'Customer Key',    placeholder: 'Your customer key',              type: 'text'     },
    ],
  },
  { id: 'curve',       name: 'Curve Dental',       vendor: 'Curve Dental',   logo: 'C',   available: false },
  { id: 'carestream',  name: 'Carestream Dental',  vendor: 'Carestream',     logo: 'CS',  available: false },
  { id: 'dolphin',     name: 'Dolphin',            vendor: 'Dolphin Imaging', logo: 'DP', available: false },
  { id: 'orthotrac',   name: 'Orthotrac',          vendor: 'Carestream',     logo: 'OT',  available: false },
]

// ── Types ──────────────────────────────────────────────────────────────────────
type PracticeSettings = {
  make_inbound_url?: string
  make_recall_url?: string
  make_confirmation_url?: string
  retell_api_key?: string
  retell_inbound_agent_id?: string
  retell_recall_agent_id?: string
  retell_confirmation_agent_id?: string
  twilio_account_sid?: string
  twilio_auth_token?: string
  twilio_phone_number?: string
  resend_api_key?: string
  from_email?: string
  notification_email?: string
  // PMS integration
  pms_provider?: string
  pms_api_url?: string
  pms_api_key?: string
  pms_api_username?: string
  pms_api_password?: string
  pms_site_id?: string
  pms_database?: string
  pms_customer_key?: string
  // Sync config
  sync_appointments?: boolean
  sync_patients?: boolean
  sync_direction?: 'bidirectional' | 'pms_to_platform' | 'platform_to_pms'
  sync_frequency?: 'realtime' | '15min' | 'hourly' | 'daily'
  sync_create_missing_patients?: boolean
  sync_update_existing?: boolean
}

type Profile = {
  full_name: string
  email: string
  phone: string
  job_title: string
  practice_id: string
  practices: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zip_code: string
    phone: string
    email: string
    webhook_secret: string | null
    settings: PracticeSettings | null
  } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy} className="h-7 px-2 shrink-0">
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function SecretInput({
  id, value, onChange, placeholder,
}: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative flex items-center">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Make.com
  const [makeInboundUrl, setMakeInboundUrl] = useState('')
  const [makeRecallUrl, setMakeRecallUrl] = useState('')
  const [makeConfirmationUrl, setMakeConfirmationUrl] = useState('')

  // Retell AI
  const [retellApiKey, setRetellApiKey] = useState('')
  const [retellInboundAgentId, setRetellInboundAgentId] = useState('')
  const [retellRecallAgentId, setRetellRecallAgentId] = useState('')
  const [retellConfirmationAgentId, setRetellConfirmationAgentId] = useState('')
  const [showRetellSection, setShowRetellSection] = useState(false)

  // PMS integration
  const [selectedPms, setSelectedPms] = useState<string | null>(null)
  const [pmsFields, setPmsFields] = useState<Record<string, string>>({})
  const [pmsConnected, setPmsConnected] = useState(false)

  // Sync config
  const [syncAppointments, setSyncAppointments] = useState(true)
  const [syncPatients, setSyncPatients] = useState(true)
  const [syncDirection, setSyncDirection] = useState<PracticeSettings['sync_direction']>('bidirectional')
  const [syncFrequency, setSyncFrequency] = useState<PracticeSettings['sync_frequency']>('realtime')
  const [syncCreateMissing, setSyncCreateMissing] = useState(true)
  const [syncUpdateExisting, setSyncUpdateExisting] = useState(true)

  const router = useRouter()
  const supabase = createClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app').replace(/\/$/, '')

  const ourEndpoints = [
    { label: 'Inbound Call',            url: `${appUrl}/api/webhooks/inbound`,      description: 'Make.com Inbound Call scenario → HTTP module URL' },
    { label: 'Recall Campaign',          url: `${appUrl}/api/webhooks/recall`,       description: 'Make.com Recall Campaign scenario → HTTP module URL' },
    { label: 'Appointment Confirmation', url: `${appUrl}/api/webhooks/confirmation`, description: 'Make.com Confirmation scenario → HTTP module URL' },
  ]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('full_name, email, phone, job_title, practice_id, practices(id, name, address, city, state, zip_code, phone, email, webhook_secret, settings)')
        .eq('id', user.id)
        .single()
      if (!data) return

      const practices = Array.isArray(data.practices) ? data.practices[0] || null : data.practices
      const p = { ...data, practices } as Profile
      setProfile(p)

      const s = practices?.settings as PracticeSettings | null
      if (!s) return

      setMakeInboundUrl(s.make_inbound_url || '')
      setMakeRecallUrl(s.make_recall_url || '')
      setMakeConfirmationUrl(s.make_confirmation_url || '')
      setRetellApiKey(s.retell_api_key || '')
      setRetellInboundAgentId(s.retell_inbound_agent_id || '')
      setRetellRecallAgentId(s.retell_recall_agent_id || '')
      setRetellConfirmationAgentId(s.retell_confirmation_agent_id || '')

      if (s.pms_provider) {
        setSelectedPms(s.pms_provider)
        setPmsConnected(true)
        setPmsFields({
          api_url:      s.pms_api_url || '',
          api_key:      s.pms_api_key || '',
          api_username: s.pms_api_username || '',
          api_password: s.pms_api_password || '',
          site_id:      s.pms_site_id || '',
          database:     s.pms_database || '',
          customer_key: s.pms_customer_key || '',
        })
      }

      if (s.sync_appointments !== undefined) setSyncAppointments(s.sync_appointments)
      if (s.sync_patients     !== undefined) setSyncPatients(s.sync_patients)
      if (s.sync_direction)     setSyncDirection(s.sync_direction)
      if (s.sync_frequency)     setSyncFrequency(s.sync_frequency)
      if (s.sync_create_missing_patients !== undefined) setSyncCreateMissing(s.sync_create_missing_patients)
      if (s.sync_update_existing         !== undefined) setSyncUpdateExisting(s.sync_update_existing)
    }
    load()
  }, [supabase])

  function showFeedback(msg: string) {
    setSuccess(msg)
    setError(null)
    setTimeout(() => setSuccess(null), 4000)
  }

  async function saveSettings(patch: Partial<PracticeSettings>, successMsg: string, key: string) {
    if (!profile?.practice_id) return
    setSaving(key)
    setError(null)
    const newSettings: PracticeSettings = { ...(profile.practices?.settings || {}), ...patch }
    const { error: err } = await supabase
      .from('practices')
      .update({ settings: newSettings })
      .eq('id', profile.practice_id)
    if (err) { setError(err.message) }
    else {
      showFeedback(successMsg)
      setProfile(prev => prev ? { ...prev, practices: prev.practices ? { ...prev.practices, settings: newSettings } : null } : null)
    }
    setSaving(null)
  }

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving('profile')
    setError(null)
    const fd = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: err } = await supabase.from('users').update({
      full_name: fd.get('full_name') as string,
      phone:     (fd.get('phone') as string)     || null,
      job_title: (fd.get('job_title') as string) || null,
    }).eq('id', user.id)
    if (err) setError(err.message)
    else { showFeedback('Profile updated'); router.refresh() }
    setSaving(null)
  }

  async function handleMakeSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await saveSettings({
      make_inbound_url:      makeInboundUrl.trim()      || undefined,
      make_recall_url:       makeRecallUrl.trim()        || undefined,
      make_confirmation_url: makeConfirmationUrl.trim()  || undefined,
    }, 'Make.com URLs saved', 'make')
  }

  async function handleRetellSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await saveSettings({
      retell_api_key:                retellApiKey.trim()                || undefined,
      retell_inbound_agent_id:       retellInboundAgentId.trim()        || undefined,
      retell_recall_agent_id:        retellRecallAgentId.trim()         || undefined,
      retell_confirmation_agent_id:  retellConfirmationAgentId.trim()   || undefined,
    }, 'Retell AI settings saved', 'retell')
  }

  async function handlePmsSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedPms) return
    await saveSettings({
      pms_provider:    selectedPms,
      pms_api_url:     pmsFields.api_url      || undefined,
      pms_api_key:     pmsFields.api_key      || undefined,
      pms_api_username: pmsFields.api_username || undefined,
      pms_api_password: pmsFields.api_password || undefined,
      pms_site_id:     pmsFields.site_id      || undefined,
      pms_database:    pmsFields.database      || undefined,
      pms_customer_key: pmsFields.customer_key || undefined,
    }, `${PMS_OPTIONS.find(p => p.id === selectedPms)?.name} integration saved`, 'pms')
    setPmsConnected(true)
  }

  async function handlePmsDisconnect() {
    await saveSettings({
      pms_provider: undefined, pms_api_url: undefined, pms_api_key: undefined,
      pms_api_username: undefined, pms_api_password: undefined,
      pms_site_id: undefined, pms_database: undefined, pms_customer_key: undefined,
    }, 'PMS disconnected', 'pms')
    setSelectedPms(null)
    setPmsFields({})
    setPmsConnected(false)
  }

  async function handleSyncSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await saveSettings({
      sync_appointments:          syncAppointments,
      sync_patients:              syncPatients,
      sync_direction:             syncDirection,
      sync_frequency:             syncFrequency,
      sync_create_missing_patients: syncCreateMissing,
      sync_update_existing:       syncUpdateExisting,
    }, 'Sync settings saved', 'sync')
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving('password')
    setError(null)
    const fd = new FormData(e.currentTarget)
    const newPw = fd.get('new_password') as string
    if (newPw !== fd.get('confirm_password')) { setError('Passwords do not match'); setSaving(null); return }
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); setSaving(null); return }
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    if (err) setError(err.message)
    else { showFeedback('Password updated');(e.target as HTMLFormElement).reset() }
    setSaving(null)
  }

  if (!profile) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
  }

  const activePmsConfig = PMS_OPTIONS.find(p => p.id === selectedPms)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and practice settings</p>
      </div>

      {success && <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md border border-green-200">{success}</div>}
      {error   && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

      {/* ── PROFILE ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={profile.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input id="job_title" name="job_title" defaultValue={profile.job_title || ''} />
              </div>
            </div>
            <Button type="submit" disabled={saving === 'profile'}>{saving === 'profile' ? 'Saving…' : 'Save Profile'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* ── PRACTICE INFO ────────────────────────────────────────────────────── */}
      {profile.practices && (
        <Card>
          <CardHeader>
            <CardTitle>Practice Information</CardTitle>
            <CardDescription>Your practice details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Practice Name', profile.practices.name],
              ['Address', [profile.practices.address, profile.practices.city, profile.practices.state, profile.practices.zip_code].filter(Boolean).join(', ') || '—'],
              ['Phone', profile.practices.phone || '—'],
              ['Email', profile.practices.email || '—'],
            ].map(([label, val], i, arr) => (
              <div key={label}>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{val}</span>
                </div>
                {i < arr.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── PMS INTEGRATIONS ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-violet-100 mt-0.5">
              <Plug className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle>PMS Integration</CardTitle>
              <CardDescription>
                Connect your Practice Management Software to sync appointments and patient records in real time.
              </CardDescription>
            </div>
          </div>
          {pmsConnected && activePmsConfig && (
            <div className="flex items-center gap-2 mt-1 ml-10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Connected to {activePmsConfig.name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* PMS picker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {PMS_OPTIONS.map((pms) => {
              const isSelected = selectedPms === pms.id
              const isConnected = pmsConnected && selectedPms === pms.id
              return (
                <button
                  key={pms.id}
                  type="button"
                  disabled={!pms.available}
                  onClick={() => {
                    if (!pms.available) return
                    setSelectedPms(isSelected ? null : pms.id)
                    if (!isSelected) setPmsConnected(false)
                  }}
                  className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all
                    ${!pms.available ? 'opacity-50 cursor-not-allowed bg-muted/40 border-border'
                    : isSelected    ? 'border-violet-500 bg-violet-50'
                    :                 'border-border hover:border-violet-300 bg-background'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {pms.logo}
                    </div>
                    {!pms.available && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
                    )}
                    {isConnected && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {isSelected && !isConnected && (
                      <Circle className="h-4 w-4 text-violet-500" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight mt-1">{pms.name}</p>
                  <p className="text-xs text-muted-foreground">{pms.vendor}</p>
                </button>
              )
            })}
          </div>

          {/* Credentials form — only for selected available PMS */}
          {selectedPms && activePmsConfig?.available && (
            <div className="border rounded-xl p-5 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{activePmsConfig.name} Credentials</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activePmsConfig.helpText}</p>
                </div>
                {pmsConnected && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs"
                    onClick={handlePmsDisconnect}>
                    Disconnect
                  </Button>
                )}
              </div>
              <form onSubmit={handlePmsSave} className="space-y-3">
                {activePmsConfig.fields?.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`pms_${field.key}`}>{field.label}</Label>
                    {field.type === 'password' ? (
                      <SecretInput
                        id={`pms_${field.key}`}
                        value={pmsFields[field.key] || ''}
                        onChange={(v) => setPmsFields(f => ({ ...f, [field.key]: v }))}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        id={`pms_${field.key}`}
                        type={field.type}
                        value={pmsFields[field.key] || ''}
                        onChange={(e) => setPmsFields(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
                <Button type="submit" disabled={saving === 'pms'} className="mt-2">
                  {saving === 'pms' ? 'Saving…' : pmsConnected ? 'Update Credentials' : 'Connect PMS'}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SYNC CONFIGURATION ───────────────────────────────────────────────── */}
      <Card className={!pmsConnected ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-blue-100 mt-0.5">
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Sync Configuration
                {!pmsConnected && (
                  <Badge variant="secondary" className="text-xs">Connect a PMS first</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Control what data syncs between your PMS and the Dental AI Growth System.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSyncSave} className="space-y-6">

            {/* What to sync */}
            <div>
              <p className="text-sm font-medium mb-3">What to Sync</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={syncAppointments} onChange={(e) => setSyncAppointments(e.target.checked)} className="mt-0.5 rounded" />
                  <div>
                    <p className="text-sm font-medium">Appointments</p>
                    <p className="text-xs text-muted-foreground">Sync appointment schedules, status changes, and confirmations</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={syncPatients} onChange={(e) => setSyncPatients(e.target.checked)} className="mt-0.5 rounded" />
                  <div>
                    <p className="text-sm font-medium">Patients</p>
                    <p className="text-xs text-muted-foreground">Sync patient demographics, contact info, and recall dates</p>
                  </div>
                </label>
              </div>
            </div>

            <Separator />

            {/* Sync direction */}
            <div>
              <p className="text-sm font-medium mb-1">Sync Direction</p>
              <p className="text-xs text-muted-foreground mb-3">
                Choose how data flows between your PMS and the platform. Bidirectional is recommended.
              </p>
              <div className="space-y-2">
                {([
                  ['bidirectional',     'Bidirectional (Recommended)',   'Changes in either system are reflected in the other'],
                  ['pms_to_platform',   'PMS → Platform only',           'Platform reads from PMS; platform changes do not write back'],
                  ['platform_to_pms',   'Platform → PMS only',           'Platform writes to PMS; PMS changes are not pulled'],
                ] as const).map(([value, label, desc]) => (
                  <label key={value} className="flex items-start gap-3 cursor-pointer border rounded-lg p-3 hover:bg-muted/30 transition">
                    <input
                      type="radio"
                      name="sync_direction"
                      value={value}
                      checked={syncDirection === value}
                      onChange={() => setSyncDirection(value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sync frequency */}
            <div>
              <p className="text-sm font-medium mb-1">Sync Frequency</p>
              <p className="text-xs text-muted-foreground mb-3">How often the platform polls or receives updates from your PMS.</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['realtime', 'Real-time',   'Webhook-based, instant'],
                  ['15min',    'Every 15 min', 'Polling'],
                  ['hourly',   'Hourly',        'Polling'],
                  ['daily',    'Daily',          'Scheduled overnight'],
                ] as const).map(([value, label, desc]) => (
                  <label key={value} className={`flex items-center gap-2.5 cursor-pointer border rounded-lg px-3 py-2.5 transition
                    ${syncFrequency === value ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/30'}`}>
                    <input
                      type="radio"
                      name="sync_frequency"
                      value={value}
                      checked={syncFrequency === value}
                      onChange={() => setSyncFrequency(value)}
                    />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Conflict resolution */}
            <div>
              <p className="text-sm font-medium mb-3">Conflict Resolution</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={syncCreateMissing} onChange={(e) => setSyncCreateMissing(e.target.checked)} className="mt-0.5 rounded" />
                  <div>
                    <p className="text-sm font-medium">Create missing patients</p>
                    <p className="text-xs text-muted-foreground">
                      If a patient exists in the PMS but not in the platform, create them automatically
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={syncUpdateExisting} onChange={(e) => setSyncUpdateExisting(e.target.checked)} className="mt-0.5 rounded" />
                  <div>
                    <p className="text-sm font-medium">Update existing records</p>
                    <p className="text-xs text-muted-foreground">
                      Overwrite platform data with PMS data when a conflict is detected
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={saving === 'sync' || !pmsConnected}>
              {saving === 'sync' ? 'Saving…' : 'Save Sync Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── MAKE.COM WEBHOOK URLS ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-orange-100 mt-0.5">
              <ArrowRight className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle>Make.com Webhook URLs</CardTitle>
              <CardDescription>
                Enter the webhook URLs from your Make.com scenarios. The platform uses these to trigger your automations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMakeSave} className="space-y-4">
            {[
              { id: 'make_inbound',      label: 'Inbound Call Scenario',     val: makeInboundUrl,      set: setMakeInboundUrl      },
              { id: 'make_recall',       label: 'Recall Campaign Scenario',   val: makeRecallUrl,       set: setMakeRecallUrl       },
              { id: 'make_confirmation', label: 'Confirmation Scenario',      val: makeConfirmationUrl, set: setMakeConfirmationUrl },
            ].map(({ id, label, val, set }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} placeholder="https://hook.eu1.make.com/xxxxx" value={val} onChange={e => set(e.target.value)} />
              </div>
            ))}
            <Button type="submit" disabled={saving === 'make'}>{saving === 'make' ? 'Saving…' : 'Save Make.com URLs'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* ── PLATFORM WEBHOOK ENDPOINTS ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-blue-100 mt-0.5">
              <ArrowLeft className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle>Platform Webhook Endpoints</CardTitle>
              <CardDescription>
                Copy these into Make.com as the URL in each scenario&apos;s HTTP module.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {ourEndpoints.map(ep => (
            <div key={ep.label} className="space-y-1.5">
              <p className="text-sm font-medium">{ep.label}</p>
              <p className="text-xs text-muted-foreground">{ep.description}</p>
              <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <code className="text-xs flex-1 break-all">{ep.url}</code>
                <CopyButton value={ep.url} />
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Practice ID</p>
            <p className="text-xs text-muted-foreground">
              Include as <code className="bg-muted px-1 rounded">practice_id</code> in every Make.com HTTP request body
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs flex-1">{profile.practice_id}</code>
              <CopyButton value={profile.practice_id} />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Webhook Secret</p>
            <p className="text-xs text-muted-foreground">
              Add as header <code className="bg-muted px-1 rounded">x-webhook-secret</code> in every Make.com HTTP request
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs flex-1">
                {profile.practices?.webhook_secret
                  ? showSecret ? profile.practices.webhook_secret : '••••••••••••••••••••••••'
                  : 'Not set — run: UPDATE practices SET webhook_secret = \'your-secret\''}
              </code>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecret(s => !s)} className="h-7 px-2 shrink-0">
                {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              {profile.practices?.webhook_secret && <CopyButton value={profile.practices.webhook_secret} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── RETELL AI ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <button
            type="button"
            onClick={() => setShowRetellSection(s => !s)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div className="p-1.5 rounded-md bg-purple-100 mt-0.5">
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle>Retell AI Configuration</CardTitle>
              <CardDescription>Agent IDs and API key for your Serenity voice assistant</CardDescription>
            </div>
            {showRetellSection ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showRetellSection && (
          <CardContent>
            <form onSubmit={handleRetellSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="retell_api_key">Retell API Key</Label>
                <SecretInput id="retell_api_key" value={retellApiKey} onChange={setRetellApiKey} placeholder="key_xxxxxxxx" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retell_inbound">Inbound Agent ID</Label>
                <Input id="retell_inbound" value={retellInboundAgentId} onChange={e => setRetellInboundAgentId(e.target.value)} placeholder="agent_xxxx" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retell_recall">Recall Agent ID</Label>
                <Input id="retell_recall" value={retellRecallAgentId} onChange={e => setRetellRecallAgentId(e.target.value)} placeholder="agent_xxxx" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retell_conf">Confirmation Agent ID</Label>
                <Input id="retell_conf" value={retellConfirmationAgentId} onChange={e => setRetellConfirmationAgentId(e.target.value)} placeholder="agent_xxxx" />
              </div>
              <Button type="submit" disabled={saving === 'retell'} variant="outline">
                {saving === 'retell' ? 'Saving…' : 'Save Retell AI Settings'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* ── CHANGE PASSWORD ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" name="new_password" type="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" minLength={8} required />
            </div>
            <Button type="submit" variant="outline" disabled={saving === 'password'}>
              {saving === 'password' ? 'Updating…' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
