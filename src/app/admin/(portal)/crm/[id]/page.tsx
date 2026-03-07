import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LeadDetailTabs } from '@/components/admin/crm/lead-detail-tabs'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const service = createServiceClient()

  const [{ data: lead }, { data: specialtyDefaults }] = await Promise.all([
    service.from('crm_leads').select('*').eq('id', params.id).single(),
    service.from('crm_specialty_defaults')
      .select('specialty, avg_appt_value, after_hours_call_pct, hold_time_abandon_pct, no_show_rate_pct, no_show_multiplier')
      .order('specialty'),
  ])

  if (!lead) notFound()

  const trackLabel = lead.track === 'track_1' ? 'Track 1' : 'Track 2'

  const daysSinceOptIn = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / 86400000
  )

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/admin/crm"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        Back to CRM
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {lead.first_name} {lead.last_name}
            </h1>
            <TrackChip track={lead.track} />
            <ScoreChip score={lead.lead_score} />
            <StatusChip status={lead.status} />
          </div>
          {lead.business_name && (
            <p className="text-slate-400 text-sm mt-0.5">{lead.business_name}</p>
          )}
          <p className="text-slate-500 text-xs mt-0.5">
            {lead.lead_id} · {trackLabel} · Added {new Date(lead.created_at).toLocaleDateString()} · {daysSinceOptIn} days ago
          </p>
        </div>
      </div>

      {/* Detail tabs */}
      <LeadDetailTabs lead={lead} specialtyDefaults={specialtyDefaults ?? []} />
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
