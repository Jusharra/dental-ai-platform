import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Plus, Users2 } from 'lucide-react'

export default async function AdminCRMPage({
  searchParams,
}: {
  searchParams: { track?: string; status?: string; score?: string; q?: string }
}) {
  const service = createServiceClient()

  let query = service
    .from('crm_leads')
    .select('id, lead_id, track, first_name, last_name, business_name, email, source, status, lead_score, email_sequence_stage, last_email_sent, next_email_date, created_at')
    .order('created_at', { ascending: false })

  if (searchParams.track)  query = query.eq('track', searchParams.track)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.score)  query = query.eq('lead_score', searchParams.score)

  const { data: leads } = await query
  let rows = leads ?? []

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    rows = rows.filter(l =>
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
      (l.business_name ?? '').toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
    )
  }

  const total    = rows.length
  const hot      = rows.filter(l => l.lead_score === 'Hot').length
  const booked   = rows.filter(l => l.status === 'Booked').length
  const active   = rows.filter(l => l.status === 'Active').length

  const filterBtnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition'
  const activeStyle   = `${filterBtnBase} bg-orange-500/10 border-orange-500/30 text-orange-400`
  const inactiveStyle = `${filterBtnBase} bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600`

  function filterLink(patch: Record<string, string>) {
    const p = { ...searchParams, ...patch }
    Object.keys(p).forEach(k => { if (!p[k]) delete p[k] })
    return `/admin/crm?${new URLSearchParams(p as Record<string, string>)}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} leads · {hot} hot · {booked} booked · {active} active
          </p>
        </div>
        <Link href="/admin/crm/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-lg transition">
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Leads',  value: total,  color: 'text-white'        },
          { label: 'Hot Leads',    value: hot,    color: 'text-orange-400'   },
          { label: 'Booked',       value: booked, color: 'text-green-400'    },
          { label: 'Active',       value: active, color: 'text-blue-400'     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search name, business, email…"
          className="bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 w-60"
        />
        {/* Track filter */}
        {[
          { label: 'All Tracks', val: '' },
          { label: 'Track 1',   val: 'track_1' },
          { label: 'Track 2',   val: 'track_2' },
        ].map(f => (
          <Link key={f.val}
            href={filterLink({ track: f.val })}
            className={searchParams.track === f.val || (!searchParams.track && !f.val) ? activeStyle : inactiveStyle}>
            {f.label}
          </Link>
        ))}
        <div className="w-px h-5 bg-slate-700" />
        {/* Status filter */}
        {[
          { label: 'All',          val: '' },
          { label: 'Active',       val: 'Active' },
          { label: 'Booked',       val: 'Booked' },
          { label: 'Unsubscribed', val: 'Unsubscribed' },
        ].map(f => (
          <Link key={f.val}
            href={filterLink({ status: f.val })}
            className={searchParams.status === f.val || (!searchParams.status && !f.val) ? activeStyle : inactiveStyle}>
            {f.label}
          </Link>
        ))}
        <div className="w-px h-5 bg-slate-700" />
        {/* Score filter */}
        {[
          { label: 'All Scores', val: '' },
          { label: 'Hot',        val: 'Hot'  },
          { label: 'Warm',       val: 'Warm' },
          { label: 'New',        val: 'New'  },
          { label: 'Cold',       val: 'Cold' },
        ].map(f => (
          <Link key={f.val}
            href={filterLink({ score: f.val })}
            className={searchParams.score === f.val || (!searchParams.score && !f.val) ? activeStyle : inactiveStyle}>
            {f.label}
          </Link>
        ))}
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              {['Lead', 'Track', 'Score', 'Status', 'Sequence Stage', 'Next Email', 'Source', 'Added'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">
                      {lead.first_name} {lead.last_name}
                      <span className="ml-2 text-xs text-slate-500">{lead.lead_id}</span>
                    </p>
                    {lead.business_name && (
                      <p className="text-xs text-slate-500 truncate max-w-40">{lead.business_name}</p>
                    )}
                    <p className="text-xs text-slate-600">{lead.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TrackChip track={lead.track} />
                </td>
                <td className="px-4 py-3">
                  <ScoreChip score={lead.lead_score} />
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={lead.status} />
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{lead.email_sequence_stage}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {lead.next_email_date
                    ? new Date(lead.next_email_date).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{lead.source}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/crm/${lead.id}`}
                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition">
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 py-16 text-sm">
                  <Users2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrackChip({ track }: { track: string }) {
  return track === 'track_1'
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">Track 1</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">Track 2</span>
}

function ScoreChip({ score }: { score: string }) {
  const map: Record<string, string> = {
    Hot:  'bg-orange-500/15 text-orange-400',
    Warm: 'bg-yellow-500/15 text-yellow-400',
    New:  'bg-blue-500/15 text-blue-400',
    Cold: 'bg-slate-700 text-slate-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[score] ?? 'bg-slate-700 text-slate-400'}`}>
      {score}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:       'bg-green-500/15 text-green-400',
    Booked:       'bg-orange-500/15 text-orange-400',
    Unsubscribed: 'bg-slate-700 text-slate-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-700 text-slate-400'}`}>
      {status}
    </span>
  )
}
