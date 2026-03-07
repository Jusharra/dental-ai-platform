'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type SpecialtyDefault = {
  specialty: string
  avg_appt_value: number
  after_hours_call_pct: number
  hold_time_abandon_pct: number
  no_show_rate_pct: number
  no_show_multiplier: number
}

type Props = {
  specialtyDefaults: SpecialtyDefault[]
  onClose?: () => void
}

const TRACK_1_SPECIALTIES = ['Dental', 'Primary Care', 'Orthopedics', 'Cardiology', 'Dermatology', 'Ophthalmology', 'Other']
const ORG_SIZES = ['Less than 50', '50-500', '500-5000', '5000+']
const AI_USAGE = ['Yes', 'No', 'Not Sure'] as const

export function LeadForm({ specialtyDefaults, onClose }: Props) {
  const router = useRouter()
  const [track, setTrack] = useState<'track_1' | 'track_2'>('track_1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Track-1 calculator state
  const [specialty, setSpecialty] = useState('Dental')
  const [monthlyAppts, setMonthlyAppts] = useState('')
  const [losses, setLosses] = useState({ after: 0, hold: 0, noShow: 0, total: 0 })

  // Track-2 scorer state
  const [govScore, setGovScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState('Low')
  const [currentAI, setCurrentAI] = useState<string>('No')
  const [jobTitle, setJobTitle] = useState('')
  const [orgSize, setOrgSize] = useState('50-500')

  // Recalculate revenue loss
  useEffect(() => {
    if (track !== 'track_1') return
    const defaults = specialtyDefaults.find(d => d.specialty === specialty)
    if (!defaults || !monthlyAppts) {
      setLosses({ after: 0, hold: 0, noShow: 0, total: 0 })
      return
    }
    const appts = parseInt(monthlyAppts) || 0
    const after  = appts * 12 * defaults.after_hours_call_pct  * defaults.avg_appt_value
    const hold   = appts * 12 * defaults.hold_time_abandon_pct * defaults.avg_appt_value
    const noShow = appts * 12 * defaults.no_show_rate_pct      * defaults.avg_appt_value * defaults.no_show_multiplier
    setLosses({ after, hold, noShow, total: after + hold + noShow })
  }, [track, specialty, monthlyAppts, specialtyDefaults])

  // Recalculate governance score
  useEffect(() => {
    if (track !== 'track_2') return
    const AI_POINTS: Record<string, number> = { Yes: 20, No: 5, 'Not Sure': 10 }
    const TITLE_POINTS: Record<string, number> = {
      'CISO': 20, 'Chief Compliance Officer': 20, 'CIO': 15,
      'VP Risk & Compliance': 15, 'VP Information Security': 18, 'Other': 8,
    }
    const SIZE_POINTS: Record<string, number> = {
      'Less than 50': 5, '50-500': 10, '500-5000': 15, '5000+': 20,
    }
    const score = (AI_POINTS[currentAI] ?? 0) + (TITLE_POINTS[jobTitle] ?? 0) + (SIZE_POINTS[orgSize] ?? 0)
    setGovScore(score)
    setRiskLevel(score <= 25 ? 'Low' : score <= 45 ? 'Medium' : 'High')
  }, [track, currentAI, jobTitle, orgSize])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      track,
      first_name:    fd.get('first_name'),
      last_name:     fd.get('last_name'),
      business_name: fd.get('business_name'),
      email:         fd.get('email'),
      phone:         fd.get('phone'),
      source:        fd.get('source'),
      notes:         fd.get('notes'),
    }

    if (track === 'track_1') {
      body.practice_specialty        = specialty
      body.monthly_appointments      = parseInt(monthlyAppts) || null
      body.after_hours_loss          = losses.after
      body.hold_time_loss            = losses.hold
      body.no_show_loss              = losses.noShow
      body.total_annual_revenue_loss = losses.total
    } else {
      body.job_title           = jobTitle
      body.organization_size   = orgSize
      body.currently_using_ai  = currentAI
      body.industry            = fd.get('industry')
      body.governance_score    = govScore
      body.risk_level          = riskLevel
    }

    const res = await fetch('/api/admin/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? 'Failed to create lead')
      setSaving(false)
      return
    }

    const lead = await res.json()
    router.push(`/admin/crm/${lead.id}`)
    router.refresh()
  }

  const inputCls = 'bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full'
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1'
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Track selector */}
      <div>
        <p className={labelCls}>Track</p>
        <div className="flex gap-2">
          {(['track_1', 'track_2'] as const).map(t => (
            <button key={t} type="button"
              onClick={() => setTrack(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                track === t
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              {t === 'track_1' ? 'Track 1 — Revenue Recovery' : 'Track 2 — Governance'}
            </button>
          ))}
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input name="first_name" required placeholder="Jane" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input name="last_name" placeholder="Smith" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Business Name</label>
          <input name="business_name" placeholder="Smith Dental" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <input name="email" type="email" required placeholder="jane@example.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input name="phone" placeholder="(555) 000-0000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Source</label>
          <select name="source" className={inputCls} defaultValue="Manual">
            <option>Manual</option>
            <option>Website</option>
            <option>Referral</option>
            <option>LinkedIn</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {/* Track-1: Calculator */}
      {track === 'track_1' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium text-white">Revenue Loss Calculator</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Practice Specialty</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputCls}>
                {TRACK_1_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Monthly Appointments</label>
              <input
                type="number" min="0" placeholder="e.g. 200"
                value={monthlyAppts} onChange={e => setMonthlyAppts(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          {losses.total > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'After-Hours Loss', val: losses.after },
                { label: 'Hold Time Loss',   val: losses.hold  },
                { label: 'No-Show Loss',     val: losses.noShow },
                { label: 'Total Annual Loss', val: losses.total, highlight: true },
              ].map(({ label, val, highlight }) => (
                <div key={label} className={`p-3 rounded-lg ${highlight ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-800'}`}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-sm font-semibold ${highlight ? 'text-orange-400' : 'text-white'}`}>{fmt(val)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Track-2: Governance scorer */}
      {track === 'track_2' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium text-white">Governance Scoring</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Currently Using AI?</label>
              <select value={currentAI} onChange={e => setCurrentAI(e.target.value)} className={inputCls}>
                {AI_USAGE.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Job Title</label>
              <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {['CISO', 'Chief Compliance Officer', 'CIO', 'VP Risk & Compliance', 'VP Information Security', 'Other'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Organization Size</label>
              <select value={orgSize} onChange={e => setOrgSize(e.target.value)} className={inputCls}>
                {ORG_SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <input name="industry" placeholder="Healthcare, Finance, etc." className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400">Governance Score</p>
              <p className="text-lg font-bold text-white">{govScore}<span className="text-slate-500 text-sm">/60</span></p>
            </div>
            <div className={`flex-1 rounded-lg p-3 ${
              riskLevel === 'High' ? 'bg-red-500/10 border border-red-500/20' :
              riskLevel === 'Medium' ? 'bg-yellow-500/10 border border-yellow-500/20' :
              'bg-green-500/10 border border-green-500/20'
            }`}>
              <p className="text-xs text-slate-400">Risk Level</p>
              <p className={`text-sm font-semibold ${
                riskLevel === 'High' ? 'text-red-400' :
                riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>{riskLevel}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Notes</label>
        <textarea name="notes" rows={3} placeholder="Any additional context…" className={inputCls} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end">
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg transition">
          {saving ? 'Creating…' : 'Create Lead'}
        </button>
      </div>
    </form>
  )
}
