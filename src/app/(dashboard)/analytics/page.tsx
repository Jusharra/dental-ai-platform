import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Users, Calendar, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'


function StatBar({ label, value, total, color = 'bg-primary' }: {
  label: string
  value: number
  total: number
  color?: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium">{value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    // Call stats
    { count: totalCalls },
    { count: callsThisMonth },
    { count: callsThisWeek },
    { data: callsByType },
    { data: callsByOutcome },
    // Appointment stats
    { count: totalAppointments },
    { count: appointmentsThisMonth },
    { count: confirmedCount },
    { count: completedCount },
    { count: noShowCount },
    { count: cancelledCount },
    // Patient stats
    { count: totalPatients },
    { count: newPatientsThisMonth },
    { count: activePatients },
  ] = await Promise.all([
    // Calls
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).gte('call_date', thirtyDaysAgo),
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).gte('call_date', sevenDaysAgo),
    supabase.from('call_logs').select('call_type').eq('practice_id', practiceId),
    supabase.from('call_logs').select('call_outcome').eq('practice_id', practiceId).not('call_outcome', 'is', null),
    // Appointments
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).gte('appointment_date', thirtyDaysAgo),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('confirmation_status', 'confirmed'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'completed'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'no_show'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'cancelled'),
    // Patients
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).is('deleted_at', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).gte('created_at', thirtyDaysAgo).is('deleted_at', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active').is('deleted_at', null),
  ])

  // Aggregate call type counts
  const callTypeCounts: Record<string, number> = {}
  callsByType?.forEach(r => {
    callTypeCounts[r.call_type] = (callTypeCounts[r.call_type] || 0) + 1
  })

  // Aggregate outcome counts
  const outcomeCounts: Record<string, number> = {}
  callsByOutcome?.forEach(r => {
    if (r.call_outcome) outcomeCounts[r.call_outcome] = (outcomeCounts[r.call_outcome] || 0) + 1
  })

  const noShowRate = totalAppointments ? Math.round(((noShowCount || 0) / (totalAppointments || 1)) * 100) : 0
  const confirmationRate = totalAppointments ? Math.round(((confirmedCount || 0) / (totalAppointments || 1)) * 100) : 0
  const completionRate = totalAppointments ? Math.round(((completedCount || 0) / (totalAppointments || 1)) * 100) : 0

  const callTypeLabels: Record<string, string> = {
    inbound: 'Inbound',
    recall: 'Recall',
    confirmation_7day: '7-Day Confirmation',
    confirmation_3day: '3-Day Confirmation',
    confirmation_1day: '1-Day Confirmation',
    reminder_3hour: '3-Hour Reminder',
  }

  const outcomeLabels: Record<string, string> = {
    appointment_booked: 'Appointment Booked',
    appointment_confirmed: 'Confirmed',
    appointment_declined: 'Declined',
    appointment_rescheduled: 'Rescheduled',
    no_answer: 'No Answer',
    voicemail: 'Voicemail',
    wrong_number: 'Wrong Number',
    callback_requested: 'Callback Requested',
    other: 'Other',
  }

  const outcomeColors: Record<string, string> = {
    appointment_booked: 'bg-green-500',
    appointment_confirmed: 'bg-blue-500',
    no_answer: 'bg-gray-400',
    voicemail: 'bg-gray-300',
    appointment_declined: 'bg-red-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance overview for your practice automation</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+{newPatientsThisMonth || 0}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">{callsThisMonth || 0}</span> last 30 days ·{' '}
              <span className="font-medium">{callsThisWeek || 0}</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmation Rate</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmedCount || 0} of {totalAppointments || 0} appointments confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">No-Show Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${noShowRate > 10 ? 'text-red-600' : ''}`}>
              {noShowRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {noShowCount || 0} no-shows out of {totalAppointments || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Call Volume by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Calls by Type</CardTitle>
            <CardDescription>Breakdown of all AI call activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(callTypeCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No call data yet</p>
            ) : (
              Object.entries(callTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <StatBar
                    key={type}
                    label={callTypeLabels[type] || type.replace(/_/g, ' ')}
                    value={count}
                    total={totalCalls || 1}
                    color="bg-primary"
                  />
                ))
            )}
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
            <CardDescription>Results from all AI-driven calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(outcomeCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No outcome data yet</p>
            ) : (
              Object.entries(outcomeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([outcome, count]) => (
                  <StatBar
                    key={outcome}
                    label={outcomeLabels[outcome] || outcome.replace(/_/g, ' ')}
                    value={count}
                    total={totalCalls || 1}
                    color={outcomeColors[outcome] || 'bg-muted-foreground'}
                  />
                ))
            )}
          </CardContent>
        </Card>

        {/* Appointment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Outcomes</CardTitle>
            <CardDescription>All-time appointment status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalAppointments === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No appointment data yet</p>
            ) : (
              <>
                <StatBar label="Completed" value={completedCount || 0} total={totalAppointments || 1} color="bg-green-500" />
                <StatBar label="Confirmed" value={confirmedCount || 0} total={totalAppointments || 1} color="bg-blue-500" />
                <StatBar label="No-show" value={noShowCount || 0} total={totalAppointments || 1} color="bg-red-400" />
                <StatBar label="Cancelled" value={cancelledCount || 0} total={totalAppointments || 1} color="bg-gray-400" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Summary</CardTitle>
            <CardDescription>Patient base overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">{activePatients || 0}</p>
                <p className="text-sm text-muted-foreground">Active Patients</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{(totalPatients || 0) - (activePatients || 0)}</p>
                <p className="text-sm text-muted-foreground">Inactive / Archived</p>
              </div>
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New this month</span>
                <Badge variant="secondary">+{newPatientsThisMonth || 0}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Appointments this month</span>
                <Badge variant="secondary">{appointmentsThisMonth || 0}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion rate</span>
                <Badge variant={completionRate >= 70 ? 'default' : 'outline'}>{completionRate}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
