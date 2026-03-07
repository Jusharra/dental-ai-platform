import { createServiceClient } from '@/lib/supabase/server'
import { Shield, AlertTriangle, UserX, Eye, Activity } from 'lucide-react'

export default async function SecurityPage() {
  const service = createServiceClient()

  const now = new Date()
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const d7  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: failedToday },
    { data: failed7d },
    { data: impersonations7d },
    { data: logins7d },
    { data: recentFailed },
    { data: recentImpersonations },
  ] = await Promise.all([
    service.from('audit_logs').select('id').eq('action', 'failed_login').gte('created_at', h24),
    service.from('audit_logs').select('id, ip_address').eq('action', 'failed_login').gte('created_at', d7),
    service.from('audit_logs').select('id').eq('resource_type', 'impersonation').gte('created_at', d7),
    service.from('audit_logs').select('practice_id').eq('action', 'login').gte('created_at', d7),
    service.from('audit_logs')
      .select('id, ip_address, created_at, users(email, full_name), practices(name)')
      .eq('action', 'failed_login')
      .order('created_at', { ascending: false })
      .limit(25),
    service.from('audit_logs')
      .select('id, created_at, changes, users(email, full_name), practices(name)')
      .eq('resource_type', 'impersonation')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Suspicious IPs: 3+ failed logins in 7d
  const ipCounts = (failed7d ?? []).reduce<Record<string, number>>((acc, log) => {
    if (log.ip_address) acc[log.ip_address] = (acc[log.ip_address] ?? 0) + 1
    return acc
  }, {})
  const suspiciousIps = Object.entries(ipCounts)
    .filter(([, n]) => n >= 3)
    .sort(([, a], [, b]) => b - a)

  // Active practices this week (unique)
  const activePractices = new Set((logins7d ?? []).map(l => l.practice_id)).size

  const kpis = [
    {
      label: 'Failed Logins (24h)',
      value: (failedToday ?? []).length,
      icon: <UserX className="w-4 h-4 text-red-400" />,
      bg: 'bg-red-500/10',
      alert: (failedToday ?? []).length > 5,
    },
    {
      label: 'Failed Logins (7d)',
      value: (failed7d ?? []).length,
      icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
      bg: 'bg-orange-500/10',
      alert: false,
    },
    {
      label: 'Impersonations (7d)',
      value: (impersonations7d ?? []).length,
      icon: <Eye className="w-4 h-4 text-purple-400" />,
      bg: 'bg-purple-500/10',
      alert: false,
    },
    {
      label: 'Suspicious IPs',
      value: suspiciousIps.length,
      icon: <Shield className="w-4 h-4 text-yellow-400" />,
      bg: 'bg-yellow-500/10',
      alert: suspiciousIps.length > 0,
    },
    {
      label: 'Active Practices (7d)',
      value: activePractices,
      icon: <Activity className="w-4 h-4 text-green-400" />,
      bg: 'bg-green-500/10',
      alert: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform-wide security monitoring · auto-refreshes on page load</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`bg-slate-900 border rounded-xl p-4 ${k.alert ? 'border-red-500/50' : 'border-slate-800'}`}>
            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
              {k.icon}
            </div>
            <p className={`text-2xl font-bold ${k.alert ? 'text-red-400' : 'text-white'}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent failed logins */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-white text-sm">Recent Failed Logins</h3>
          </div>
          {(recentFailed ?? []).length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Time', 'User / Practice', 'IP'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(recentFailed ?? []).map(log => {
                  const user     = log.users     as unknown as { email: string; full_name: string } | null
                  const practice = log.practices as unknown as { name: string } | null
                  return (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        <p className="text-slate-300">{user?.email ?? '—'}</p>
                        <p className="text-slate-500 text-[11px]">{practice?.name ?? ''}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-400">
                        {log.ip_address ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-slate-500 py-10 text-sm">No failed logins recorded</p>
          )}
        </div>

        {/* Right column: suspicious IPs + impersonation */}
        <div className="space-y-5">

          {/* Suspicious IPs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-white text-sm">Suspicious IPs</h3>
              <span className="ml-auto text-xs text-slate-500">3+ failures in 7d</span>
            </div>
            {suspiciousIps.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['IP Address', 'Failed Attempts'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {suspiciousIps.map(([ip, count]) => (
                    <tr key={ip}>
                      <td className="px-4 py-2.5 font-mono text-sm text-orange-300">{ip}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-red-500/15 text-red-400 text-xs px-2 py-0.5 rounded-full font-semibold">{count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-slate-500 py-6 text-sm">No suspicious IP activity</p>
            )}
          </div>

          {/* Impersonation sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-white text-sm">Impersonation Sessions (7d)</h3>
            </div>
            {(recentImpersonations ?? []).length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Time', 'Admin', 'Impersonated Practice'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(recentImpersonations ?? []).map(log => {
                    const user     = log.users     as unknown as { email: string } | null
                    const changes  = log.changes   as Record<string, string> | null
                    const practice = log.practices as unknown as { name: string } | null
                    return (
                      <tr key={log.id}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-300">
                          {user?.email ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-300">
                          {changes?.impersonated_practice ?? practice?.name ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-slate-500 py-6 text-sm">No impersonation sessions in last 7 days</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}