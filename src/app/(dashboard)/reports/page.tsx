'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, Mail, RefreshCw, FileText, Phone, CalendarCheck, Users, ShieldCheck, BarChart3 } from 'lucide-react'
import type { CallPerformanceData, ConfirmationData, RecallData, InsuranceData, ExecutiveData, ReportType } from '@/app/api/reports/data/route'

// ─── Date Range Helpers ────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0] }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function startOfMonth() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

const PRESETS = [
  { label: 'Last 7 days',   start: () => daysAgo(7),       end: today },
  { label: 'Last 30 days',  start: () => daysAgo(30),      end: today },
  { label: 'This month',    start: startOfMonth,            end: today },
  { label: 'Last 90 days',  start: () => daysAgo(90),      end: today },
] as const

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'call_performance', label: 'Call Performance', icon: Phone,         description: 'Total calls, outcomes, costs, duration breakdown' },
  { value: 'confirmation',     label: 'Confirmation',     icon: CalendarCheck, description: 'Appointment confirmation rates by call type' },
  { value: 'recall',           label: 'Recall Campaign',  icon: Users,         description: 'Patient reactivation and recall call results' },
  { value: 'insurance',        label: 'Insurance',        icon: ShieldCheck,   description: 'Verification form completion and status' },
  { value: 'executive',        label: 'Executive Summary', icon: BarChart3,    description: 'Full platform overview — all KPIs in one report' },
]

function fmtCents(c: number) { return `$${(c / 100).toFixed(2)}` }
function fmtSecs(s: number)  { return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s` }
function pct(n: number, d: number) { return d ? `${Math.round((n / d) * 100)}%` : '—' }

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Report Previews ──────────────────────────────────────────────────────────
function CallPerformancePreview({ data }: { data: CallPerformanceData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Calls"   value={data.total_calls} />
        <Stat label="Total Cost"    value={fmtCents(data.total_cost_cents)} sub={data.total_calls ? `${fmtCents(Math.round(data.total_cost_cents / data.total_calls))} avg/call` : undefined} />
        <Stat label="Avg Duration"  value={fmtSecs(data.avg_duration_seconds)} />
        <Stat label="Total Talk Time" value={fmtSecs(data.total_duration_seconds)} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Calls by Type</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Type', 'Count', 'Avg Duration', 'Cost'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(data.by_type).map(([type, v]) => (
                <tr key={type}>
                  <td className="px-4 py-2.5 capitalize">{type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5">{v.count}</td>
                  <td className="px-4 py-2.5">{fmtSecs(v.count ? Math.round(v.duration_s / v.count) : 0)}</td>
                  <td className="px-4 py-2.5">{fmtCents(v.cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Outcomes</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Outcome', 'Count', '% of Total'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(data.by_outcome).sort(([,a],[,b]) => b - a).map(([outcome, count]) => (
                <tr key={outcome}>
                  <td className="px-4 py-2.5 capitalize">{outcome.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5">{count}</td>
                  <td className="px-4 py-2.5">{pct(count, data.total_calls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ConfirmationPreview({ data }: { data: ConfirmationData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Calls Sent"        value={data.total_outbound} />
        <Stat label="Confirmed"         value={data.confirmed} />
        <Stat label="Declined"          value={data.declined} />
        <Stat label="Confirmation Rate" value={`${data.confirmation_rate}%`} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">By Call Type</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Type', 'Sent', 'Confirmed', 'Rate'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.by_type.map(r => (
                <tr key={r.type}>
                  <td className="px-4 py-2.5 capitalize">{r.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5">{r.sent}</td>
                  <td className="px-4 py-2.5">{r.confirmed}</td>
                  <td className="px-4 py-2.5">{r.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RecallPreview({ data }: { data: RecallData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Stat label="Recall Calls"       value={data.total_recall_calls} />
      <Stat label="Appointments Booked" value={data.appointments_booked} />
      <Stat label="Reactivation Rate"  value={`${data.reactivation_rate}%`} />
      <Stat label="Unique Patients"    value={data.unique_patients_contacted} />
      <Stat label="No Answer"          value={data.no_answer} />
      <Stat label="Voicemail"          value={data.voicemail} />
    </div>
  )
}

function InsurancePreview({ data }: { data: InsuranceData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Stat label="Forms Sent"       value={data.forms_sent} />
      <Stat label="Patient Submitted" value={data.patient_submitted} />
      <Stat label="Staff Verified"   value={data.staff_verified} />
      <Stat label="Pending Patient"  value={data.pending_patient} />
      <Stat label="Pending Review"   value={data.pending_staff} />
      <Stat label="Completion Rate"  value={`${data.completion_rate}%`} />
    </div>
  )
}

function ExecutivePreview({ data }: { data: ExecutiveData }) {
  const cp = data?.call_performance
  const conf = data?.confirmation
  const rec = data?.recall
  const ins = data?.insurance
  if (!cp || !conf || !rec || !ins) return null
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total AI Calls"    value={cp.total_calls} />
        <Stat label="Total AI Cost"     value={fmtCents(cp.total_cost_cents)} />
        <Stat label="Confirmation Rate" value={`${conf.confirmation_rate}%`} sub={`${conf.confirmed} of ${conf.total_outbound}`} />
        <Stat label="Reactivation Rate" value={`${rec.reactivation_rate}%`} sub={`${rec.appointments_booked} booked`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Recall Calls"      value={rec.total_recall_calls} />
        <Stat label="Avg Call Duration" value={fmtSecs(cp.avg_duration_seconds)} />
        <Stat label="Insurance Forms"   value={ins.forms_sent} />
        <Stat label="Ins. Verified"     value={ins.staff_verified} sub={`${ins.completion_rate}% complete`} />
      </div>
    </div>
  )
}

// ─── Email Modal ───────────────────────────────────────────────────────────────
function EmailModal({ onClose, onSend }: { onClose: () => void; onSend: (email: string, subscribe: boolean) => void }) {
  const [email, setEmail] = useState('')
  const [subscribe, setSubscribe] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Send Report via Email</h2>
        <p className="text-sm text-gray-500 mb-4">The PDF will be generated and sent as an attachment.</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer">
          <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} className="rounded" />
          Send this report monthly (auto-subscribe)
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => email && onSend(email, subscribe)} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition disabled:opacity-50">Send PDF</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('call_performance')
  const [preset, setPreset]         = useState(1)        // 'Last 30 days'
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')
  const [useCustom, setUseCustom]     = useState(false)

  const [reportData, setReportData]   = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [showEmail, setShowEmail]     = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent]     = useState(false)

  // Generation counter — stale fetches that complete after a newer one started are discarded
  const fetchGen = useRef(0)

  const start = useCustom ? customStart : PRESETS[preset].start()
  const end   = useCustom ? customEnd   : PRESETS[preset].end()

  const fetchReport = useCallback(async () => {
    if (!start || !end) return
    const gen = ++fetchGen.current
    setLoading(true)
    setReportData(null)
    setError(null)
    try {
      const res = await fetch(`/api/reports/data?type=${reportType}&start=${start}&end=${end}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (gen === fetchGen.current) setReportData(data)
    } catch (e) {
      if (gen === fetchGen.current)
        setError(e instanceof Error ? e.message : 'Failed to load report')
    } finally {
      if (gen === fetchGen.current) setLoading(false)
    }
  }, [reportType, start, end])

  useEffect(() => { fetchReport() }, [fetchReport])

  function downloadPdf() {
    window.open(`/api/reports/pdf?type=${reportType}&start=${start}&end=${end}`, '_blank')
  }

  function downloadCsv() {
    window.location.href = `/api/reports/csv?type=${reportType}&start=${start}&end=${end}`
  }

  async function sendEmail(email: string, subscribe: boolean) {
    setSendingEmail(true)
    try {
      await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, start, end, recipient_email: email, save_subscription: subscribe }),
      })
      setEmailSent(true)
      setShowEmail(false)
      setTimeout(() => setEmailSent(false), 3000)
    } finally {
      setSendingEmail(false)
    }
  }

  const selectedType = REPORT_TYPES.find(r => r.value === reportType)!

  return (
    <div className="space-y-6">
      {showEmail && <EmailModal onClose={() => setShowEmail(false)} onSend={sendEmail} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate, download, and schedule practice performance reports</p>
        </div>
        {emailSent && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            Report sent successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Report Type */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Type</p>
            <div className="space-y-1">
              {REPORT_TYPES.map(r => {
                const Icon = r.icon
                const active = reportType === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => { setReportType(r.value); setReportData(null); setLoading(true); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition text-sm ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Date Range</p>
            <div className="space-y-1 mb-3">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => { setPreset(i); setUseCustom(false); setReportData(null); setLoading(true); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!useCustom && preset === i ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Custom range</p>
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setUseCustom(true) }}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setUseCustom(true) }}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Right: Report Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-800 text-sm">{selectedType.label}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{start && end ? `${start} to ${end}` : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchReport} className="p-1.5 text-gray-400 hover:text-gray-600 transition" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={downloadCsv} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={downloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => setShowEmail(true)} disabled={sendingEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading report…
              </div>
            )}
            {error && !loading && (
              <div className="text-red-500 text-sm py-8 text-center">{error}</div>
            )}
            {!loading && !error && reportData && (
              <>
                {reportType === 'call_performance' && <CallPerformancePreview data={reportData as CallPerformanceData} />}
                {reportType === 'confirmation'     && <ConfirmationPreview data={reportData as ConfirmationData} />}
                {reportType === 'recall'           && <RecallPreview data={reportData as RecallData} />}
                {reportType === 'insurance'        && <InsurancePreview data={reportData as InsuranceData} />}
                {reportType === 'executive'        && <ExecutivePreview data={reportData as ExecutiveData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}