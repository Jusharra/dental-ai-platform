'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, Mail, RefreshCw, Send } from 'lucide-react'
import type { ReportType } from '@/app/api/reports/data/route'

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'call_performance', label: 'Call Performance' },
  { value: 'confirmation',     label: 'Appointment Confirmation' },
  { value: 'recall',           label: 'Recall Campaign' },
  { value: 'insurance',        label: 'Insurance Verification' },
  { value: 'executive',        label: 'Executive Summary' },
]

function today()      { return new Date().toISOString().split('T')[0] }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }

const PRESETS = [
  { label: 'Last 7 days',  start: () => daysAgo(7),  end: today },
  { label: 'Last 30 days', start: () => daysAgo(30), end: today },
  { label: 'This month',   start: startOfMonth,       end: today },
  { label: 'Last 90 days', start: () => daysAgo(90), end: today },
]

function fmtCents(c: number) { return `$${(c / 100).toFixed(2)}` }
function fmtSecs(s: number)  { return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s` }

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function ReportPreview({ type, data }: { type: ReportType; data: Record<string, unknown> }) {
  if (type === 'call_performance') {
    const d = data as { total_calls: number; total_cost_cents: number; avg_duration_seconds: number; total_duration_seconds: number; by_type: Record<string, { count: number; duration_s: number; cost_cents: number }>; by_outcome: Record<string, number> }
    if (!d.by_type) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Calls"  value={d.total_calls} />
          <Stat label="Total Cost"   value={fmtCents(d.total_cost_cents)} />
          <Stat label="Avg Duration" value={fmtSecs(d.avg_duration_seconds)} />
          <Stat label="Talk Time"    value={fmtSecs(d.total_duration_seconds)} />
        </div>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-800">{['Type', 'Count', 'Cost'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700">
              {Object.entries(d.by_type).map(([t, v]) => (
                <tr key={t} className="bg-slate-900">
                  <td className="px-4 py-2.5 text-slate-300 capitalize">{t.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 text-slate-300">{v.count}</td>
                  <td className="px-4 py-2.5 text-slate-300">{fmtCents(v.cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (type === 'confirmation') {
    const d = data as { total_outbound: number; confirmed: number; declined: number; confirmation_rate: number }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Calls Sent"        value={d.total_outbound} />
        <Stat label="Confirmed"         value={d.confirmed} />
        <Stat label="Declined"          value={d.declined} />
        <Stat label="Confirmation Rate" value={`${d.confirmation_rate}%`} />
      </div>
    )
  }

  if (type === 'recall') {
    const d = data as { total_recall_calls: number; appointments_booked: number; reactivation_rate: number; unique_patients_contacted: number }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Recall Calls"      value={d.total_recall_calls} />
        <Stat label="Appts Booked"      value={d.appointments_booked} />
        <Stat label="Reactivation Rate" value={`${d.reactivation_rate}%`} />
        <Stat label="Unique Patients"   value={d.unique_patients_contacted} />
      </div>
    )
  }

  if (type === 'insurance') {
    const d = data as { forms_sent: number; patient_submitted: number; staff_verified: number; completion_rate: number }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Forms Sent"       value={d.forms_sent} />
        <Stat label="Submitted"        value={d.patient_submitted} />
        <Stat label="Verified"         value={d.staff_verified} />
        <Stat label="Completion Rate"  value={`${d.completion_rate}%`} />
      </div>
    )
  }

  if (type === 'executive') {
    const d = data as { call_performance: { total_calls: number; total_cost_cents: number }; confirmation: { confirmation_rate: number }; recall: { reactivation_rate: number; appointments_booked: number }; insurance: { staff_verified: number } }
    if (!d.call_performance || !d.confirmation || !d.recall) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Calls"       value={d.call_performance.total_calls} />
        <Stat label="AI Cost"           value={fmtCents(d.call_performance.total_cost_cents)} />
        <Stat label="Confirmation Rate" value={`${d.confirmation.confirmation_rate}%`} />
        <Stat label="Patients Reactivated" value={d.recall.appointments_booked} sub={`${d.recall.reactivation_rate}% rate`} />
      </div>
    )
  }

  return null
}

export function AdminReportsClient({ practices }: { practices: { id: string; name: string }[] }) {
  const [practiceId, setPracticeId] = useState(practices[0]?.id ?? '')
  const [reportType, setReportType] = useState<ReportType>('executive')
  const [preset, setPreset]         = useState(1)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading]       = useState(false)
  const [sendTo, setSendTo]         = useState('')
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  const fetchGen = useRef(0)
  const start = PRESETS[preset].start()
  const end   = PRESETS[preset].end()

  const fetchReport = useCallback(async () => {
    if (!practiceId) return
    const gen = ++fetchGen.current
    setLoading(true)
    setReportData(null)
    try {
      const res = await fetch(`/api/reports/data?type=${reportType}&start=${start}&end=${end}&practice_id=${practiceId}`)
      const data = res.ok ? await res.json() : null
      if (gen === fetchGen.current) setReportData(data)
    } finally {
      if (gen === fetchGen.current) setLoading(false)
    }
  }, [practiceId, reportType, start, end])

  useEffect(() => { fetchReport() }, [fetchReport])

  async function handleSend() {
    if (!sendTo) return
    setSending(true)
    try {
      await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, start, end, recipient_email: sendTo, practice_id: practiceId }),
      })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Practice</label>
          <select value={practiceId} onChange={e => setPracticeId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none min-w-[200px]">
            {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Report Type</label>
          <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none">
            {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Period</label>
          <select value={preset} onChange={e => setPreset(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none">
            {PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => window.location.href = `/api/reports/csv?type=${reportType}&start=${start}&end=${end}&practice_id=${practiceId}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-600 text-slate-300 rounded-lg hover:border-slate-500 transition">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => window.open(`/api/reports/pdf?type=${reportType}&start=${start}&end=${end}&practice_id=${practiceId}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-600 text-slate-300 rounded-lg hover:border-slate-500 transition">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={fetchReport}
            className="p-2 text-slate-400 hover:text-slate-200 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {loading && <div className="text-center text-slate-500 py-10 text-sm">Loading…</div>}
        {!loading && reportData && <ReportPreview type={reportType} data={reportData} />}
      </div>

      {/* Send to Practice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-orange-400" /> Send Report to Practice
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={sendTo}
            onChange={e => setSendTo(e.target.value)}
            placeholder="practice@example.com"
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button onClick={handleSend} disabled={sending || !sendTo}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm rounded-lg transition">
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending…' : sent ? 'Sent!' : 'Send PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}