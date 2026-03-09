import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Building2, Users, Phone, TrendingUp, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Activity,
} from 'lucide-react'

// MRR lookup by tier
const TIER_MRR: Record<string, number> = {
  starter:      295,
  professional: 495,
  enterprise:   895,
}

export default async function AdminDashboardPage() {
  const service = createServiceClient()

  const [
    { data: practices },
    { data: users },
    { data: recentCalls },
    { data: pendingVerifications },
  ] = await Promise.all([
    service.from('practices')
      .select('id, name, subscription_tier, subscription_status, trial_ends_at, onboarding_status, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    service.from('users').select('id, role, is_active, practice_id').is('deleted_at', null),
    service.from('call_logs')
      .select('id, call_type, call_outcome, created_at, practice_id')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()) // this month
      .order('created_at', { ascending: false }),
    service.from('insurance_verifications')
      .select('id, practice_id, status')
      .eq('status', 'pending_staff'),
  ])

  const allPractices  = practices  ?? []
  const allUsers      = users      ?? []
  const allCalls      = recentCalls ?? []
  const pendingVerifs = pendingVerifications ?? []

  // Derived stats
  const activePractices  = allPractices.filter(p => p.subscription_status === 'active')
  const trialPractices   = allPractices.filter(p => p.subscription_status === 'trial')
  const mrr = activePractices.reduce((sum, p) => sum + (TIER_MRR[p.subscription_tier ?? ''] ?? 0), 0)

  const trialExpiringSoon = trialPractices.filter(p => {
    if (!p.trial_ends_at) return false
    const days = Math.ceil((new Date(p.trial_ends_at).getTime() - Date.now()) / 86400000)
    return days <= 7 && days >= 0
  })

  const needsOnboarding = allPractices.filter(p =>
    p.onboarding_status === 'not_started' && p.subscription_status === 'active'
  )

  const callsToday = allCalls.filter(c =>
    new Date(c.created_at).toDateString() === new Date().toDateString()
  )

  const stats = [
    {
      label: 'Active Practices',
      value: activePractices.length,
      sub: `${trialPractices.length} in trial`,
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Monthly Recurring Revenue',
      value: `$${mrr.toLocaleString()}`,
      sub: `${allPractices.length} total practices`,
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
      bg: 'bg-green-500/10',
    },
    {
      label: 'Calls This Month',
      value: allCalls.length,
      sub: `${callsToday.length} today`,
      icon: <Phone className="w-5 h-5 text-orange-400" />,
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Platform Users',
      value: allUsers.filter(u => u.is_active).length,
      sub: `across ${allPractices.length} practices`,
      icon: <Users className="w-5 h-5 text-purple-400" />,
      bg: 'bg-purple-500/10',
    },
  ]

  // Call outcome breakdown this month
  const booked    = allCalls.filter(c => c.call_outcome === 'appointment_booked').length
  const confirmed = allCalls.filter(c => c.call_outcome === 'appointment_confirmed').length
  const noAnswer  = allCalls.filter(c => c.call_outcome === 'no_answer').length
  const voicemail = allCalls.filter(c => c.call_outcome === 'voicemail').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Alerts */}
      {(trialExpiringSoon.length > 0 || needsOnboarding.length > 0 || pendingVerifs.length > 0) && (
        <div className="space-y-2">
          {trialExpiringSoon.map(p => (
            <Alert key={p.id} type="warning"
              message={`${p.name} — trial expires ${new Date(p.trial_ends_at!).toLocaleDateString()}`}
              href={`/admin/practices/${p.id}`}
            />
          ))}
          {needsOnboarding.length > 0 && (
            <Alert type="info"
              message={`${needsOnboarding.length} active practice${needsOnboarding.length > 1 ? 's' : ''} haven't started onboarding`}
              href="/admin/practices"
            />
          )}
          {pendingVerifs.length > 0 && (
            <Alert type="info"
              message={`${pendingVerifs.length} insurance verification${pendingVerifs.length > 1 ? 's' : ''} awaiting staff review across practices`}
              href="/admin/practices"
            />
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Practices by status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Practices by Status</h2>
            <Link href="/admin/practices" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Active',    count: activePractices.length,                                  color: 'bg-green-500'  },
              { label: 'Trial',     count: trialPractices.length,                                   color: 'bg-blue-500'   },
              { label: 'Cancelled', count: allPractices.filter(p => p.subscription_status === 'cancelled').length, color: 'bg-slate-600' },
              { label: 'Suspended', count: allPractices.filter(p => p.subscription_status === 'suspended').length, color: 'bg-red-500'   },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${row.color} shrink-0`} />
                <span className="text-sm text-slate-300 flex-1">{row.label}</span>
                <span className="text-sm font-semibold text-white">{row.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Plan distribution</p>
            <div className="space-y-1.5">
              {(['starter','professional','enterprise'] as const).map(tier => {
                const count = allPractices.filter(p => p.subscription_tier === tier && p.subscription_status === 'active').length
                const labels: Record<string, string> = { starter: 'Serenity Capture', professional: 'Serenity Complete', enterprise: 'Enterprise' }
                return (
                  <div key={tier} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{labels[tier]}</span>
                    <span className="text-slate-300 font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Call activity this month */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                AI Call Activity — This Month
              </span>
            </h2>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{allCalls.length}</p>
          <p className="text-xs text-slate-500 mb-4">Total Serenity-handled calls</p>
          <div className="space-y-2.5">
            {[
              { label: 'Appointments Booked',    count: booked,    color: 'text-green-400'  },
              { label: 'Appointments Confirmed', count: confirmed, color: 'text-blue-400'   },
              { label: 'No Answer',              count: noAnswer,  color: 'text-slate-400'  },
              { label: 'Voicemail',              count: voicemail, color: 'text-yellow-400' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color}`}>{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent practices */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Recently Added Practices</h2>
          <Link href="/admin/practices" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
            All practices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {allPractices.slice(0, 5).map(p => (
            <Link key={p.id} href={`/admin/practices/${p.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TierBadge tier={p.subscription_tier} />
                <StatusBadge status={p.subscription_status} />
              </div>
            </Link>
          ))}
          {allPractices.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">No practices yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Alert({ type, message, href }: { type: 'warning' | 'info'; message: string; href: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition
      ${type === 'warning'
        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20'
        : 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20'}`}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      {message}
      <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" />
    </Link>
  )
}

function TierBadge({ tier }: { tier: string | null }) {
  const map: Record<string, string> = {
    starter:      'Capture',
    professional: 'Complete',
    enterprise:   'Enterprise',
  }
  return (
    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
      {map[tier ?? ''] ?? tier ?? '—'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400',
    trial:     'bg-blue-500/15 text-blue-400',
    cancelled: 'bg-slate-700 text-slate-400',
    suspended: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-slate-700 text-slate-400'}`}>
      {status}
    </span>
  )
}
