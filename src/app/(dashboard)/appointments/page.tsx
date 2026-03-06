import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock } from 'lucide-react'
import { AddAppointmentDialog } from '@/components/appointments/add-appointment-dialog'
import { AppointmentActions } from '@/components/appointments/appointment-actions'
import Link from 'next/link'

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { view?: string; date?: string }
}) {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = searchParams.date || today

  // Fetch today's appointments and upcoming
  const [{ data: todayAppts }, { data: upcomingAppts }, { data: pastAppts }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, patients(id, first_name, last_name, phone)')
      .eq('practice_id', practiceId)
      .eq('appointment_date', today)
      .order('appointment_time'),
    supabase
      .from('appointments')
      .select('*, patients(id, first_name, last_name, phone)')
      .eq('practice_id', practiceId)
      .gt('appointment_date', today)
      .order('appointment_date')
      .order('appointment_time')
      .limit(50),
    supabase
      .from('appointments')
      .select('*, patients(id, first_name, last_name, phone)')
      .eq('practice_id', practiceId)
      .lt('appointment_date', today)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage appointments and scheduling</p>
        </div>
        <AddAppointmentDialog practiceId={practiceId} />
      </div>

      {/* Today Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{todayAppts?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Today&apos;s Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {todayAppts?.filter(a => a.confirmation_status === 'confirmed').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {todayAppts?.filter(a => a.confirmation_status === 'pending').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{upcomingAppts?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({todayAppts?.length || 0})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppts?.length || 0})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <AppointmentTable appointments={todayAppts || []} />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <AppointmentTable appointments={upcomingAppts || []} showDate />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <AppointmentTable appointments={pastAppts || []} showDate />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AppointmentTable({
  appointments,
  showDate = false,
}: {
  appointments: Array<{
    id: string
    appointment_date: string
    appointment_time: string
    provider_name: string
    procedure_type: string | null
    status: string
    confirmation_status: string
    duration_minutes: number
    patients: { id: string; first_name: string; last_name: string; phone: string } | null
  }>
  showDate?: boolean
}) {
  if (!appointments.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No appointments found
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              {showDate && <TableHead>Date</TableHead>}
              <TableHead>Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Procedure</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmation</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                {showDate && (
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {apt.appointment_date}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {apt.appointment_time}
                  </span>
                </TableCell>
                <TableCell>
                  {apt.patients ? (
                    <Link href={`/patients/${apt.patients.id}`} className="text-primary hover:underline font-medium">
                      {apt.patients.first_name} {apt.patients.last_name}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>{apt.provider_name}</TableCell>
                <TableCell>{apt.procedure_type || '—'}</TableCell>
                <TableCell>{apt.duration_minutes}min</TableCell>
                <TableCell>
                  <Badge variant={
                    apt.status === 'completed' ? 'default' :
                    apt.status === 'cancelled' ? 'destructive' :
                    apt.status === 'no_show' ? 'destructive' :
                    apt.status === 'confirmed' ? 'default' : 'secondary'
                  }>
                    {apt.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    apt.confirmation_status === 'confirmed' ? 'default' :
                    apt.confirmation_status === 'declined' ? 'destructive' : 'outline'
                  }>
                    {apt.confirmation_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
