import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react'
import { EditPatientDialog } from '@/components/patients/edit-patient-dialog'
import { InsurancePanel } from '@/components/patients/insurance-panel'

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!patient) {
    notFound()
  }

  const [{ data: appointments }, { data: callLogs }, { data: verifications }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', params.id)
      .order('appointment_date', { ascending: false })
      .limit(20),
    supabase
      .from('call_logs')
      .select('*')
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('insurance_verifications')
      .select('*')
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {patient.patient_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
              {patient.status}
            </Badge>
            {patient.insurance_provider && (
              <span className="text-sm text-muted-foreground">
                Insurance: {patient.insurance_provider}
              </span>
            )}
          </div>
        </div>
        <EditPatientDialog patient={patient} />
      </div>

      {/* Contact Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patient.email || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {[patient.address, patient.city, patient.state, patient.zip_code]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments?.length || 0})</TabsTrigger>
          <TabsTrigger value="calls">Call History ({callLogs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Date of Birth" value={patient.date_of_birth} />
                <InfoRow label="Gender" value={patient.gender?.replace(/_/g, ' ')} />
                <InfoRow label="Preferred Contact" value={patient.preferred_contact_method} />
                <InfoRow label="AI Consent" value={patient.consented_to_ai_calls ? 'Yes' : 'No'} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Insurance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Provider" value={patient.insurance_provider} />
                <InfoRow label="Insurance ID" value={patient.insurance_id} />
                <InfoRow label="Group" value={patient.insurance_group} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Conditions" value={patient.medical_conditions?.join(', ')} />
                <InfoRow label="Allergies" value={patient.allergies?.join(', ')} />
                <InfoRow label="Medications" value={patient.medications?.join(', ')} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recall</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Last Visit" value={patient.last_visit_date} />
                <InfoRow label="Recall Due" value={patient.recall_due_date} />
                <InfoRow label="Recall Reason" value={patient.recall_reason} />
              </CardContent>
            </Card>
            {patient.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insurance" className="mt-4">
          <InsurancePanel patient={patient} verifications={verifications ?? []} />
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!appointments?.length ? (
                <p className="text-center py-8 text-muted-foreground">No appointments found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confirmation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {apt.appointment_date}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {apt.appointment_time}
                          </span>
                        </TableCell>
                        <TableCell>{apt.provider_name}</TableCell>
                        <TableCell>{apt.procedure_type || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            apt.status === 'completed' ? 'default' :
                            apt.status === 'cancelled' ? 'destructive' :
                            apt.status === 'no_show' ? 'destructive' : 'secondary'
                          }>
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={apt.confirmation_status === 'confirmed' ? 'default' : 'outline'}>
                            {apt.confirmation_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!callLogs?.length ? (
                <p className="text-center py-8 text-muted-foreground">No call history found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>{call.call_date} {call.call_time}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{call.call_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {call.call_duration_seconds
                            ? `${Math.floor(call.call_duration_seconds / 60)}m ${call.call_duration_seconds % 60}s`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            call.call_outcome === 'appointment_booked' ? 'default' :
                            call.call_outcome === 'no_answer' ? 'secondary' : 'outline'
                          }>
                            {call.call_outcome?.replace(/_/g, ' ') || '—'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  )
}
