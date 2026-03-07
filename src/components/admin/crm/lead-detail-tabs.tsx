'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Lead = {
  id: string
  track: string
  first_name: string
  last_name: string | null
  business_name: string | null
  email: string
  phone: string | null
  source: string
  status: string
  lead_score: string
  email_sequence_stage: string
  last_email_sent: string | null
  next_email_date: string | null
  booking_link_clicked: boolean
  notes: string | null
  // Track-1
  practice_specialty: string | null
  monthly_appointments: number | null
  after_hours_loss: number | null
  hold_time_loss: number | null
  no_show_loss: number | null
  total_annual_revenue_loss: number | null
  // Track-2
  job_title: string | null
  organization_size: string | null
  currently_using_ai: string | null
  industry: string | null
  governance_score: number | null
  risk_level: string | null
}

type SpecialtyDefault = {
  specialty: string
  avg_appt_value: number
  after_hours_call_pct: number
  hold_time_abandon_pct: number
  no_show_rate_pct: number
  no_show_multiplier: number
}

export function LeadDetailTabs({
  lead,
  specialtyDefaults,
}: {
  lead: Lead
  specialtyDefaults: SpecialtyDefault[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  // Calculator state (Track-1)
  const [specialty, setSpecialty] = useState(lead.practice_specialty ?? 'Dental')
  const [monthlyAppts, setMonthlyAppts] = useState(String(lead.monthly_appointments ?? ''))
  const [calcSaved, setCalcSaved] = useState(false)

  const fmt = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
      : '—'

  function calcLosses() {
    const defaults = specialtyDefaults.find(d => d.specialty === specialty)
    if (!defaults || !monthlyAppts) return { after: 0, hold: 0, noShow: 0, total: 0 }
    const appts = parseInt(monthlyAppts) || 0
    const after  = appts * 12 * defaults.after_hours_call_pct  * defaults.avg_appt_value
    const hold   = appts * 12 * defaults.hold_time_abandon_pct * defaults.avg_appt_value
    const noShow = appts * 12 * defaults.no_show_rate_pct      * defaults.avg_appt_value * defaults.no_show_multiplier
    return { after, hold, noShow, total: after + hold + noShow }
  }

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    await fetch(`/api/admin/crm/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    router.refresh()
  }

  async function saveNotes() {
    await patch({ notes })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  async function saveCalculator() {
    const losses = calcLosses()
    await patch({
      practice_specialty:        specialty,
      monthly_appointments:      parseInt(monthlyAppts) || null,
      after_hours_loss:          losses.after,
      hold_time_loss:            losses.hold,
      no_show_loss:              losses.noShow,
      total_annual_revenue_loss: losses.total,
    })
    setCalcSaved(true)
    setTimeout(() => setCalcSaved(false), 2000)
  }

  async function handleBookingToggle() {
    if (!confirm('Mark this lead as Booked? This will stop their email sequence.')) return
    await patch({ booking_link_clicked: true })
  }

  async function handleUnsubscribe() {
    if (!confirm('Mark this lead as Unsubscribed? This will stop their email sequence.')) return
    await patch({ status: 'Unsubscribed', email_sequence_stage: 'Complete', next_email_date: null })
  }

  async function handleDelete() {
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return
    await fetch(`/api/admin/crm/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/admin/crm')
    router.refresh()
  }

  const inputCls = 'bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full'
  const rowCls   = 'flex justify-between py-2 border-b border-slate-800 last:border-0'
  const labelCls = 'text-sm text-slate-400'
  const valueCls = 'text-sm text-white font-medium'
  const losses   = calcLosses()

  return (
    <Tabs defaultValue="profile">
      <TabsList className="bg-slate-900 border border-slate-800">
        <TabsTrigger value="profile"   className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Profile</TabsTrigger>
        <TabsTrigger value="sequence"  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Email Sequence</TabsTrigger>
        <TabsTrigger value="calculator" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
          {lead.track === 'track_1' ? 'Calculator' : 'Governance'}
        </TabsTrigger>
        <TabsTrigger value="notes"     className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Notes</TabsTrigger>
      </TabsList>

      {/* Profile */}
      <TabsContent value="profile">
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Contact info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Contact</p>
            <div className={rowCls}><span className={labelCls}>Name</span><span className={valueCls}>{lead.first_name} {lead.last_name}</span></div>
            <div className={rowCls}><span className={labelCls}>Email</span><span className={valueCls}>{lead.email}</span></div>
            <div className={rowCls}><span className={labelCls}>Phone</span><span className={valueCls}>{lead.phone ?? '—'}</span></div>
            <div className={rowCls}><span className={labelCls}>Business</span><span className={valueCls}>{lead.business_name ?? '—'}</span></div>
            <div className={rowCls}><span className={labelCls}>Source</span><span className={valueCls}>{lead.source}</span></div>
          </div>

          {/* Lead status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Status</p>
            <div className={rowCls}><span className={labelCls}>Status</span><span className={valueCls}>{lead.status}</span></div>
            <div className={rowCls}><span className={labelCls}>Lead Score</span><span className={valueCls}>{lead.lead_score}</span></div>
            <div className={rowCls}><span className={labelCls}>Booking Clicked</span><span className={valueCls}>{lead.booking_link_clicked ? 'Yes' : 'No'}</span></div>
          </div>

          {/* Track-1 specific */}
          {lead.track === 'track_1' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Revenue Analysis</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Specialty',         val: lead.practice_specialty ?? '—' },
                  { label: 'Monthly Appts',     val: String(lead.monthly_appointments ?? '—') },
                  { label: 'After-Hours Loss',  val: fmt(lead.after_hours_loss) },
                  { label: 'Hold Time Loss',    val: fmt(lead.hold_time_loss) },
                  { label: 'No-Show Loss',      val: fmt(lead.no_show_loss) },
                  { label: 'Total Annual Loss', val: fmt(lead.total_annual_revenue_loss), highlight: true },
                ].map(({ label, val, highlight }) => (
                  <div key={label} className={`p-3 rounded-lg ${highlight ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-800'}`}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-orange-400' : 'text-white'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Track-2 specific */}
          {lead.track === 'track_2' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Governance Profile</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Job Title',       val: lead.job_title ?? '—' },
                  { label: 'Org Size',        val: lead.organization_size ?? '—' },
                  { label: 'Currently AI?',   val: lead.currently_using_ai ?? '—' },
                  { label: 'Industry',        val: lead.industry ?? '—' },
                  { label: 'Gov. Score',      val: `${lead.governance_score ?? '—'}/60` },
                  { label: 'Risk Level',      val: lead.risk_level ?? '—',
                    highlight: lead.risk_level === 'High' ? 'red' : lead.risk_level === 'Medium' ? 'yellow' : 'green' },
                ].map(({ label, val, highlight }) => (
                  <div key={label} className={`p-3 rounded-lg ${
                    highlight === 'red'    ? 'bg-red-500/10 border border-red-500/20' :
                    highlight === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                    highlight === 'green'  ? 'bg-green-500/10 border border-green-500/20' :
                    'bg-slate-800'
                  }`}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${
                      highlight === 'red'    ? 'text-red-400' :
                      highlight === 'yellow' ? 'text-yellow-400' :
                      highlight === 'green'  ? 'text-green-400' :
                      'text-white'
                    }`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3 flex-wrap">
          {lead.status !== 'Booked' && (
            <button onClick={handleBookingToggle} disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg transition">
              Mark as Booked
            </button>
          )}
          {lead.status !== 'Unsubscribed' && (
            <button onClick={handleUnsubscribe} disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition">
              Unsubscribe
            </button>
          )}
          <button onClick={handleDelete} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition ml-auto">
            Delete Lead
          </button>
        </div>
      </TabsContent>

      {/* Email Sequence */}
      <TabsContent value="sequence">
        <div className="mt-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Sequence Status</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Current Stage',   val: lead.email_sequence_stage },
                { label: 'Last Email Sent', val: lead.last_email_sent ? new Date(lead.last_email_sent).toLocaleDateString() : 'Not sent yet' },
                { label: 'Next Email Date', val: lead.next_email_date ? new Date(lead.next_email_date).toLocaleDateString() : '—' },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-white mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">9-Email Sequence</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 9 }, (_, i) => {
                const stageNum = parseInt((lead.email_sequence_stage).match(/\d+/)?.[0] ?? '0')
                const emailNum = i + 1
                const isCurrent  = emailNum === stageNum && lead.email_sequence_stage !== 'Complete'
                const isComplete = lead.email_sequence_stage === 'Complete' || emailNum < stageNum
                return (
                  <div key={i} className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold border transition ${
                    isCurrent  ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' :
                    isComplete ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {emailNum}
                  </div>
                )
              })}
              <div className={`flex items-center justify-center px-3 h-9 rounded-full text-xs font-semibold border ${
                lead.email_sequence_stage === 'Complete'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>Done</div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Current</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600 inline-block" /> Pending</span>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Calculator / Governance */}
      <TabsContent value="calculator">
        <div className="mt-4">
          {lead.track === 'track_1' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-white">Revenue Loss Calculator</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Practice Specialty</label>
                  <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputCls}>
                    {['Dental','Primary Care','Orthopedics','Cardiology','Dermatology','Ophthalmology','Other'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Appointments</label>
                  <input type="number" min="0" value={monthlyAppts}
                    onChange={e => setMonthlyAppts(e.target.value)}
                    className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'After-Hours Loss',  val: losses.after },
                  { label: 'Hold Time Loss',    val: losses.hold  },
                  { label: 'No-Show Loss',      val: losses.noShow },
                  { label: 'Total Annual Loss', val: losses.total, highlight: true },
                ].map(({ label, val, highlight }) => (
                  <div key={label} className={`p-3 rounded-lg ${highlight ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-800'}`}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-orange-400' : 'text-white'}`}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={saveCalculator} disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg transition">
                {calcSaved ? 'Saved!' : saving ? 'Saving…' : 'Save to Lead'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-3">Governance Score</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="text-2xl font-bold text-white">{lead.governance_score ?? 0}<span className="text-slate-500 text-sm">/60</span></p>
                </div>
                <div className={`rounded-lg p-3 border ${
                  lead.risk_level === 'High'   ? 'bg-red-500/10 border-red-500/20' :
                  lead.risk_level === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-green-500/10 border-green-500/20'
                }`}>
                  <p className="text-xs text-slate-400">Risk Level</p>
                  <p className={`text-lg font-bold ${
                    lead.risk_level === 'High'   ? 'text-red-400' :
                    lead.risk_level === 'Medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>{lead.risk_level ?? '—'}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Thresholds</p>
                  <p className="text-xs text-slate-400 mt-1">Low: 0–25</p>
                  <p className="text-xs text-slate-400">Medium: 26–45</p>
                  <p className="text-xs text-slate-400">High: 46–60</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Notes */}
      <TabsContent value="notes">
        <div className="mt-4 space-y-3">
          <textarea
            rows={8}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this lead…"
            className="bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full resize-none"
          />
          <button onClick={saveNotes} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg transition">
            {notesSaved ? 'Saved!' : saving ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
