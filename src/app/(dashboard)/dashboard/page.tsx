import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Phone, Users, AlertTriangle, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return <div className="p-6">No practice found. Please contact support.</div>

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  // Fetch dashboard stats in parallel
  const [
    { count: totalPatients },
    { count: todayAppointments },
    { count: totalCalls },
    { data: upcomingAppointments },
    { data: recentCalls },
    { count: expiringLicenses },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('appointment_date', today),
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('appointments').select('*, patients(first_name, last_name)').eq('practice_id', practiceId).gte('appointment_date', today).order('appointment_date').order('appointment_time').limit(5),
    supabase.from('call_logs').select('*, patients(first_name, last_name)').eq('practice_id', practiceId).order('created_at', { ascending: false }).limit(5),
    supabase.from('licenses_credentials').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active').lte('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])

  const stats = [
    { label: 'Active Patients', value: totalPatients || 0, icon: Users, color: 'text-blue-600' },
    { label: "Today's Appointments", value: todayAppointments || 0, icon: Calendar, color: 'text-green-600' },
    { label: 'Total Calls', value: totalCalls || 0, icon: Phone, color: 'text-purple-600' },
    { label: 'Expiring Licenses', value: expiringLicenses || 0, icon: AlertTriangle, color: expiringLicenses ? 'text-red-600' : 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your practice overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Next scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {!upcomingAppointments?.length ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">
                        {(apt.patients as unknown as { first_name: string; last_name: string })?.first_name}{' '}
                        {(apt.patients as unknown as { first_name: string; last_name: string })?.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {apt.appointment_date} at {apt.appointment_time}
                      </div>
                      {apt.procedure_type && (
                        <p className="text-xs text-muted-foreground mt-1">{apt.procedure_type}</p>
                      )}
                    </div>
                    <Badge variant={
                      apt.confirmation_status === 'confirmed' ? 'default' :
                      apt.confirmation_status === 'declined' ? 'destructive' : 'secondary'
                    }>
                      {apt.confirmation_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest AI call activity</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentCalls?.length ? (
              <p className="text-sm text-muted-foreground">No recent calls</p>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">
                        {(call.patients as unknown as { first_name: string; last_name: string })?.first_name}{' '}
                        {(call.patients as unknown as { first_name: string; last_name: string })?.last_name || call.phone_number}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {call.call_type} &bull; {call.call_date}
                      </div>
                    </div>
                    <Badge variant={
                      call.call_outcome === 'appointment_booked' ? 'default' :
                      call.call_outcome === 'appointment_confirmed' ? 'default' :
                      call.call_outcome === 'no_answer' ? 'secondary' : 'outline'
                    }>
                      {call.call_outcome?.replace(/_/g, ' ') || 'pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
