import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowRight, CheckCircle, Plug } from 'lucide-react'

export const dynamic = 'force-dynamic'


export default async function AdminPracticesPage({
  searchParams,
}: {
  searchParams: { status?: string; tier?: string; q?: string }
}) {
  const service = createServiceClient()

  let query = service
    .from('practices')
    .select(`
      id, name, subscription_tier, subscription_status, onboarding_status,
      mrr, trial_ends_at, source, created_at, logo_url, notes,
      stripe_customer_id, settings
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('subscription_status', searchParams.status)
  if (searchParams.tier)   query = query.eq('subscription_tier', searchParams.tier)

  const { data: practices } = await query

  let rows = practices ?? []

  // Client-side name search (small dataset)
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    rows = rows.filter(p => p.name.toLowerCase().includes(q))
  }

  // Get per-practice patient + user counts
  const [{ data: patientCounts }, { data: userCounts }, { data: callCounts }] = await Promise.all([
    service.from('patients').select('practice_id').is('deleted_at', null),
    service.from('users').select('practice_id').eq('is_active', true).is('deleted_at', null),
    service.from('call_logs').select('practice_id')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
  ])

  function count(arr: { practice_id: string }[] | null, id: string) {
    return (arr ?? []).filter(r => r.practice_id === id).length
  }

  const TIER_MRR: Record<string, number> = { starter: 295, professional: 495, enterprise: 895 }
  const totalMRR = rows
    .filter(p => p.subscription_status === 'active')
    .reduce((s, p) => s + (p.mrr || TIER_MRR[p.subscription_tier ?? ''] || 0), 0)

  const filterBtnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition'
  const active   = `${filterBtnBase} bg-orange-500/10 border-orange-500/30 text-orange-400`
  const inactive = `${filterBtnBase} bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600`

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Practices</h1>
          <p className="text-slate-400 text-sm mt-0.5">{rows.length} practices · ${totalMRR.toLocaleString()} MRR</p>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search by name…"
          className="bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 w-52"
        />
        {[
          { label: 'All', val: '' },
          { label: 'Active', val: 'active' },
          { label: 'Trial', val: 'trial' },
          { label: 'Cancelled', val: 'cancelled' },
        ].map(f => (
          <Link key={f.val}
            href={`/admin/practices?${new URLSearchParams({ ...(searchParams.tier ? { tier: searchParams.tier } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), ...(f.val ? { status: f.val } : {}) })}`}
            className={searchParams.status === f.val || (!searchParams.status && !f.val) ? active : inactive}>
            {f.label}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          {[
            { label: 'Capture',    val: 'starter'      },
            { label: 'Complete',   val: 'professional' },
            { label: 'Enterprise', val: 'enterprise'   },
          ].map(f => (
            <Link key={f.val}
              href={`/admin/practices?${new URLSearchParams({ ...(searchParams.status ? { status: searchParams.status } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), tier: f.val })}`}
              className={searchParams.tier === f.val ? active : inactive}>
              {f.label}
            </Link>
          ))}
        </div>
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              {['Practice', 'Plan', 'Status', 'Patients', 'Calls / mo', 'Users', 'PMS', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(p => {
              const pmsConnected = !!(p.settings as Record<string, unknown> | null)?.pms_provider
              const trialDays = p.trial_ends_at
                ? Math.ceil((new Date(p.trial_ends_at).getTime() - Date.now()) / 86400000)
                : null

              return (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        {p.notes && <p className="text-xs text-slate-500 truncate max-w-40">{p.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TierChip tier={p.subscription_tier} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={p.subscription_status} trialDays={trialDays} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{count(patientCounts, p.id)}</td>
                  <td className="px-4 py-3 text-slate-300">{count(callCounts, p.id)}</td>
                  <td className="px-4 py-3 text-slate-300">{count(userCounts, p.id)}</td>
                  <td className="px-4 py-3">
                    {pmsConnected
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <Plug className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/practices/${p.id}`}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition">
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 py-12 text-sm">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No practices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TierChip({ tier }: { tier: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    starter:      { label: 'Capture',    cls: 'bg-slate-700 text-slate-300' },
    professional: { label: 'Complete',   cls: 'bg-violet-500/20 text-violet-300' },
    enterprise:   { label: 'Enterprise', cls: 'bg-orange-500/20 text-orange-300' },
  }
  const cfg = map[tier ?? ''] ?? { label: tier ?? '—', cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
}

function StatusChip({ status, trialDays }: { status: string; trialDays: number | null }) {
  const map: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400',
    trial:     'bg-blue-500/15 text-blue-400',
    cancelled: 'bg-slate-700 text-slate-400',
    suspended: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-slate-700 text-slate-400'}`}>
      {status}{status === 'trial' && trialDays !== null ? ` (${trialDays}d)` : ''}
    </span>
  )
}