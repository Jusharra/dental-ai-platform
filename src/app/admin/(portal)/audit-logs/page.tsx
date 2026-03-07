import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { AuditLogFilters } from '@/components/admin/audit-log-filters'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 50

const ACTION_STYLES: Record<string, string> = {
  create:       'bg-green-500/15 text-green-400',
  read:         'bg-blue-500/15 text-blue-400',
  update:       'bg-yellow-500/15 text-yellow-400',
  delete:       'bg-red-500/15 text-red-400',
  export:       'bg-purple-500/15 text-purple-400',
  login:        'bg-slate-600/40 text-slate-400',
  logout:       'bg-slate-600/40 text-slate-400',
  failed_login: 'bg-red-500/20 text-red-400 font-semibold',
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const service = createServiceClient()

  const page       = Math.max(1, Number(searchParams.page ?? 1))
  const practiceId = searchParams.practice
  const action     = searchParams.action
  const resource   = searchParams.resource
  const start      = searchParams.start
  const end        = searchParams.end
  const offset     = (page - 1) * PAGE_SIZE

  const [{ data: practices }, logsResult] = await Promise.all([
    service.from('practices').select('id, name').order('name'),
    (() => {
      let q = service
        .from('audit_logs')
        .select(
          'id, action, resource_type, resource_id, changes, ip_address, user_agent, created_at, users(email, full_name), practices(name)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (practiceId) q = q.eq('practice_id', practiceId)
      if (action)     q = q.eq('action', action)
      if (resource)   q = q.eq('resource_type', resource)
      if (start)      q = q.gte('created_at', start)
      if (end)        q = q.lte('created_at', end + 'T23:59:59Z')

      return q
    })(),
  ])

  const logs       = logsResult.data ?? []
  const totalCount = logsResult.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build URL helper for pagination links
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (practiceId) params.set('practice', practiceId)
    if (action)     params.set('action', action)
    if (resource)   params.set('resource', resource)
    if (start)      params.set('start', start)
    if (end)        params.set('end', end)
    params.set('page', String(p))
    return `/admin/audit-logs?${params.toString()}`
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {totalCount.toLocaleString()} total records · All platform activity
        </p>
      </div>

      <AuditLogFilters
        practices={practices ?? []}
        current={{ practiceId, action, resource, start, end }}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800">
              {['Time', 'Practice', 'User', 'Action', 'Resource', 'Details / IP'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map(log => {
              const user     = log.users    as unknown as { email: string; full_name: string } | null
              const practice = log.practices as unknown as { name: string } | null
              const changes  = log.changes  as Record<string, unknown> | null

              return (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {practice?.name ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {user ? (
                      <>
                        <p className="text-slate-300">{user.full_name}</p>
                        <p className="text-slate-500 text-[11px]">{user.email}</p>
                      </>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_STYLES[log.action] ?? 'bg-slate-700 text-slate-400'}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-slate-300">{log.resource_type}</p>
                    {log.resource_id && (
                      <p className="font-mono text-slate-600 text-[10px] truncate max-w-[120px]">
                        {log.resource_id}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px]">
                    {changes ? (
                      <span className="font-mono text-[10px] break-all">
                        {JSON.stringify(changes).slice(0, 100)}
                        {JSON.stringify(changes).length > 100 ? '…' : ''}
                      </span>
                    ) : log.ip_address ? (
                      <span className="font-mono">{log.ip_address}</span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {!logs.length && (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-12 text-sm">
                  No audit logs match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={pageUrl(page - 1)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition">
                <ChevronLeft className="w-3 h-3" /> Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-slate-600 text-xs rounded-lg cursor-not-allowed">
                <ChevronLeft className="w-3 h-3" /> Prev
              </span>
            )}
            <span className="text-xs text-slate-400 px-2">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageUrl(page + 1)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition">
                Next <ChevronRight className="w-3 h-3" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-slate-600 text-xs rounded-lg cursor-not-allowed">
                Next <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}