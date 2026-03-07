import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { CallFilters } from '@/components/calls/call-filters'
import { CallTranscriptDialog } from '@/components/calls/call-transcript-dialog'

export default async function CallsPage({
  searchParams,
}: {
  searchParams: { type?: string; outcome?: string; page?: string }
}) {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const page = parseInt(searchParams.page || '1')
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let callQuery = supabase
    .from('call_logs')
    .select(
      'id, retell_call_id, call_date, call_time, phone_number, call_type, call_duration_seconds, call_outcome, transcript, recording_url, patients(id, first_name, last_name)',
      { count: 'exact' }
    )
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (searchParams.type)    callQuery = callQuery.eq('call_type', searchParams.type)
  if (searchParams.outcome) callQuery = callQuery.eq('call_outcome', searchParams.outcome)

  const today = new Date().toISOString().split('T')[0]

  // All 4 queries in parallel — eliminates ~200ms sequential wait
  const [
    { data: calls },
    { count: totalCalls },
    { count: bookedCalls },
    { count: todayCalls },
  ] = await Promise.all([
    callQuery,
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('call_outcome', 'appointment_booked'),
    supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('call_date', today),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call Logs</h1>
        <p className="text-muted-foreground">AI voice call history and recordings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCalls || 0}</div>
            <p className="text-sm text-muted-foreground">Total Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookedCalls || 0}</div>
            <p className="text-sm text-muted-foreground">Appointments Booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{todayCalls || 0}</div>
            <p className="text-sm text-muted-foreground">Today&apos;s Calls</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CallFilters />
        </CardHeader>
        <CardContent>
          {!calls?.length ? (
            <p className="text-center py-12 text-muted-foreground">No calls found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="text-sm">{call.call_date}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{call.call_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.patients ? (
                        <Link
                          href={`/patients/${(call.patients as unknown as { id: string; first_name: string; last_name: string }).id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {(call.patients as unknown as { first_name: string; last_name: string }).first_name}{' '}
                          {(call.patients as unknown as { first_name: string; last_name: string }).last_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{call.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{call.call_type.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {call.call_duration_seconds
                        ? `${Math.floor(call.call_duration_seconds / 60)}m ${call.call_duration_seconds % 60}s`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        call.call_outcome === 'appointment_booked' ? 'default' :
                        call.call_outcome === 'appointment_confirmed' ? 'default' :
                        call.call_outcome === 'call_failed' ? 'destructive' :
                        call.call_outcome === 'no_answer' ? 'secondary' : 'outline'
                      }>
                        {call.call_outcome?.replace(/_/g, ' ') || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.transcript ? (
                        <CallTranscriptDialog
                          callId={call.retell_call_id || call.id}
                          transcript={call.transcript}
                          recordingUrl={call.recording_url}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
