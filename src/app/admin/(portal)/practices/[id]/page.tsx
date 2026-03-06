import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Phone, Users, FileText, CheckCircle, Plug, ExternalLink, AlertCircle } from 'lucide-react'
import { ImpersonateButton } from '@/components/admin/impersonate-button'
import { PracticeStatusForm } from '@/components/admin/practice-status-form'
import { SubscriptionManager } from '@/components/admin/subscription-manager'

export default async function AdminPracticeDetailPage({ params }: { params: { id: string } }) {
  const service = createServiceClient()

  const { data: practice } = await service
    .from('practices')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!practice) notFound()

  const [
    { data: users },
    { data: recentCalls },
    { data: patients },
    { data: verifications },
    { data: auditLogs },
  ] = await Promise.all([
    service.from('users')
      .select('id, full_name, email, role, is_active, last_login_at, created_at')
      .eq('practice_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    service.from('call_logs')
      .select('id, call_type, call_outcome, call_date, call_time, call_duration_seconds')
      .eq('practice_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    service.from('patients')
      .select('id')
      .eq('practice_id', params.id)
      .is('deleted_at', null),
    service.from('insurance_verifications')
      .select('id, status')
      .eq('practice_id', params.id),
    service.from('audit_logs')
      .select('id, action, resource_type, resource_id, created_at, user_id')
      .eq('practice_id', params.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const settings = (practice.settings ?? {}) as Record<string, string>
  const pmsConnected = !!settings.pms_provider

  const callsThisMonth = (recentCalls ?? []).filter(c =>
    new Date(c.call_date) >= new Date(new Date().setDate(1))
  )

  const TIER_MRR: Record<string, number> = { starter: 295, professional: 495, enterprise: 995 }
  const mrr = practice.mrr || TIER_MRR[practice.subscription_tier ?? ''] || 0

  const tierLabel: Record<string, string> = {
    starter: 'Serenity Capture', professional: 'Serenity Complete', enterprise: 'Enterprise',
  }

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/practices"
          className="mt-1 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{practice.name}</h1>
            <StatusChip status={practice.subscription_status} />
            <TierChip tier={practice.subscription_tier} />
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Joined {new Date(practice.created_at).toLocaleDateString()} ·{' '}
            {practice.source ? `Source: ${practice.source}` : 'No source recorded'}
          </p>
        </div>
        <ImpersonateButton practiceId={practice.id} practiceName={practice.name} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Patients',        value: (patients ?? []).length, icon: <Users className="w-4 h-4 text-blue-400" />, bg: 'bg-blue-500/10' },
          { label: 'Calls This Month',value: callsThisMonth.length,   icon: <Phone className="w-4 h-4 text-orange-400" />, bg: 'bg-orange-500/10' },
          { label: 'MRR',             value: `$${mrr}`,               icon: <FileText className="w-4 h-4 text-green-400" />, bg: 'bg-green-500/10' },
          { label: 'Active Users',    value: (users ?? []).filter(u => u.is_active).length, icon: <Users className="w-4 h-4 text-purple-400" />, bg: 'bg-purple-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Overview</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            Users ({(users ?? []).length})
          </TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            Recent Calls
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            Admin
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoCard title="Contact Information">
              <InfoRow label="Phone"   value={practice.phone}  />
              <InfoRow label="Email"   value={practice.email}  />
              <InfoRow label="Website" value={practice.website} />
              <InfoRow label="Address" value={[practice.address, practice.city, practice.state, practice.zip_code].filter(Boolean).join(', ')} />
            </InfoCard>

            <InfoCard title="Subscription">
              <InfoRow label="Plan"     value={tierLabel[practice.subscription_tier ?? ''] ?? practice.subscription_tier} />
              <InfoRow label="Status"   value={practice.subscription_status} />
              <InfoRow label="MRR"      value={mrr ? `$${mrr}/mo` : null} />
              <InfoRow label="Trial Ends" value={practice.trial_ends_at ? new Date(practice.trial_ends_at).toLocaleDateString() : null} />
              <InfoRow label="Stripe Customer" value={practice.stripe_customer_id} monospace />
            </InfoCard>

            <InfoCard title="Integrations">
              <div className="flex items-center gap-2 py-1">
                {pmsConnected
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <Plug className="w-4 h-4 text-slate-600 shrink-0" />}
                <span className="text-sm text-slate-300">
                  {pmsConnected ? `PMS: ${settings.pms_provider}` : 'No PMS connected'}
                </span>
              </div>
              <div className="flex items-center gap-2 py-1">
                {settings.retell_api_key
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />}
                <span className="text-sm text-slate-300">
                  {settings.retell_api_key ? 'Retell AI configured' : 'Retell AI not configured'}
                </span>
              </div>
              <div className="flex items-center gap-2 py-1">
                {settings.make_inbound_url
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />}
                <span className="text-sm text-slate-300">
                  {settings.make_inbound_url ? 'Make.com webhooks configured' : 'Make.com not configured'}
                </span>
              </div>
            </InfoCard>

            <InfoCard title="Insurance Verifications">
              {[
                ['Pending Staff Review', (verifications ?? []).filter(v => v.status === 'pending_staff').length, 'text-orange-400'],
                ['Verified',            (verifications ?? []).filter(v => v.status === 'verified').length,       'text-green-400'],
                ['Awaiting Patient',    (verifications ?? []).filter(v => v.status === 'pending_patient').length,'text-blue-400'],
                ['Expired',             (verifications ?? []).filter(v => v.status === 'expired').length,        'text-slate-500'],
              ].map(([label, val, cls]) => (
                <div key={label as string} className="flex justify-between py-1">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={`text-sm font-semibold ${cls}`}>{val as number}</span>
                </div>
              ))}
            </InfoCard>
          </div>

          {practice.notes && (
            <InfoCard title="Internal Notes">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{practice.notes}</p>
            </InfoCard>
          )}
        </TabsContent>

        {/* ── USERS ── */}
        <TabsContent value="users" className="mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  {['Name', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(users ?? []).map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
                {!(users ?? []).length && (
                  <tr><td colSpan={5} className="text-center text-slate-500 py-8 text-sm">No users</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── CALLS ── */}
        <TabsContent value="calls" className="mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  {['Date', 'Type', 'Duration', 'Outcome'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(recentCalls ?? []).map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.call_date} {c.call_time}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {c.call_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {c.call_duration_seconds
                        ? `${Math.floor(c.call_duration_seconds / 60)}m ${c.call_duration_seconds % 60}s`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.call_outcome === 'appointment_booked' ? 'bg-green-500/15 text-green-400' :
                        c.call_outcome === 'no_answer'          ? 'bg-slate-700 text-slate-400' :
                        'bg-slate-800 text-slate-300'}`}>
                        {c.call_outcome?.replace(/_/g, ' ') ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!(recentCalls ?? []).length && (
                  <tr><td colSpan={4} className="text-center text-slate-500 py-8 text-sm">No calls recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── ADMIN ── */}
        <TabsContent value="admin" className="mt-4 space-y-4">
          <SubscriptionManager
            practiceId={practice.id}
            currentStatus={practice.subscription_status}
            currentTier={practice.subscription_tier}
            stripeCustomerId={practice.stripe_customer_id}
            stripeSubscriptionId={practice.stripe_subscription_id}
          />
          <PracticeStatusForm practice={practice} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, monospace }: { label: string; value: string | null | undefined; monospace?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-slate-300 text-right truncate ${monospace ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
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

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400',
    trial:     'bg-blue-500/15 text-blue-400',
    cancelled: 'bg-slate-700 text-slate-400',
    suspended: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${map[status] ?? 'bg-slate-700 text-slate-400'}`}>
      {status}
    </span>
  )
}