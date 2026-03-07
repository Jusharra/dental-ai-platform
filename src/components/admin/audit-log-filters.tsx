'use client'

import { useRouter, usePathname } from 'next/navigation'

const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'failed_login']
const RESOURCES = ['patient', 'appointment', 'user', 'policy', 'subscription', 'impersonation', 'report', 'call_log']

export function AuditLogFilters({
  practices,
  current,
}: {
  practices: { id: string; name: string }[]
  current: { practiceId?: string; action?: string; resource?: string; start?: string; end?: string }
}) {
  const router   = useRouter()
  const pathname = usePathname()

  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectCls = 'bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500'

  return (
    <div className="flex flex-wrap gap-3">
      <select defaultValue={current.practiceId ?? ''} onChange={e => update('practice', e.target.value)} className={selectCls}>
        <option value="">All Practices</option>
        {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <select defaultValue={current.action ?? ''} onChange={e => update('action', e.target.value)} className={selectCls}>
        <option value="">All Actions</option>
        {ACTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
      </select>

      <select defaultValue={current.resource ?? ''} onChange={e => update('resource', e.target.value)} className={selectCls}>
        <option value="">All Resources</option>
        {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <input
        type="date"
        defaultValue={current.start ?? ''}
        onChange={e => update('start', e.target.value)}
        className={selectCls}
      />
      <input
        type="date"
        defaultValue={current.end ?? ''}
        onChange={e => update('end', e.target.value)}
        className={selectCls}
      />

      {(current.practiceId || current.action || current.resource || current.start || current.end) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}