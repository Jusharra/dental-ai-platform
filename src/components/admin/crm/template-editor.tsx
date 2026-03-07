'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Template = {
  id: string
  template_id: string
  track: string
  email_number: number
  is_cold: boolean
  subject_line: string
  body: string
  when_to_send: string
}

const MERGE_FIELDS_T1 = [
  '[FIRST_NAME]', '[LAST_NAME]', '[BUSINESS_NAME]', '[EMAIL]',
  '[SPECIALTY]', '[MONTHLY_APPOINTMENTS]',
  '[AFTER_HOURS_LOSS]', '[HOLD_TIME_LOSS]', '[NO_SHOW_LOSS]',
  '[TOTAL_LOSS]', '[MONTHLY_LOSS]', '[DAILY_LOSS]',
  '[BOOKING_LINK]', '[UNSUBSCRIBE_LINK]',
]
const MERGE_FIELDS_T2 = [
  '[FIRST_NAME]', '[LAST_NAME]', '[BUSINESS_NAME]', '[EMAIL]',
  '[JOB_TITLE]', '[ORG_SIZE]', '[GOVERNANCE_SCORE]', '[RISK_LEVEL]',
  '[BOOKING_LINK]', '[UNSUBSCRIBE_LINK]',
]

export function TemplateEditor({ template }: { template: Template }) {
  const [expanded, setExpanded]     = useState(false)
  const [subject, setSubject]       = useState(template.subject_line)
  const [body, setBody]             = useState(template.body)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [showFields, setShowFields] = useState(false)

  const mergeFields = template.track === 'Track 1' ? MERGE_FIELDS_T1 : MERGE_FIELDS_T2

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/crm/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_line: subject, body }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const inputCls = 'bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full'

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800/60 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
            {template.email_number}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Email {template.email_number}
              {template.is_cold && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">COLD</span>
              )}
            </p>
            <p className="text-xs text-slate-500">{template.when_to_send}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 truncate max-w-64 hidden md:block">{subject || 'No subject'}</p>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-slate-900/50 space-y-3">
          {/* Merge field reference */}
          <button
            onClick={() => setShowFields(!showFields)}
            className="text-xs text-orange-400 hover:text-orange-300 transition"
          >
            {showFields ? 'Hide' : 'Show'} merge fields
          </button>
          {showFields && (
            <div className="flex flex-wrap gap-1.5">
              {mergeFields.map(f => (
                <span key={f} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">{f}</span>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject Line</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Body</label>
            <textarea
              rows={12}
              value={body}
              onChange={e => setBody(e.target.value)}
              className={`${inputCls} resize-y font-mono text-xs`}
            />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg transition">
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      )}
    </div>
  )
}
