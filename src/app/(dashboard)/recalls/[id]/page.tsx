import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CampaignActions } from '@/components/recalls/campaign-actions'
import { ArrowLeft, Users, CalendarCheck, Phone, Clock } from 'lucide-react'

const contactStatusColors: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-600',
  contacted:   'bg-blue-100 text-blue-700',
  booked:      'bg-green-100 text-green-700',
  declined:    'bg-red-100 text-red-700',
  no_response: 'bg-yellow-100 text-yellow-700',
}

const contactStatusLabels: Record<string, string> = {
  pending:     'Pending',
  contacted:   'Contacted',
  booked:      'Booked',
  declined:    'Declined',
  no_response: 'No Response',
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: campaign } = await supabase
    .from('recall_campaigns')
    .select('*')
    .eq('id', params.id)
    .eq('practice_id', practiceId)
    .single()

  if (!campaign) notFound()

  const { data: campaignPatients } = await supabase
    .from('recall_campaign_patients')
    .select(`
      id, contact_status, last_contact_attempt, contact_attempts, created_at,
      patients (id, first_name, last_name, phone, email, last_visit_date, recall_due_date)
    `)
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false })

  const statusCounts = {
    pending:     campaignPatients?.filter(p => p.contact_status === 'pending').length ?? 0,
    contacted:   campaignPatients?.filter(p => p.contact_status === 'contacted').length ?? 0,
    booked:      campaignPatients?.filter(p => p.contact_status === 'booked').length ?? 0,
    declined:    campaignPatients?.filter(p => p.contact_status === 'declined').length ?? 0,
    no_response: campaignPatients?.filter(p => p.contact_status === 'no_response').length ?? 0,
  }

  const campaignTypeLabels: Record<string, string> = {
    '6month_cleaning': '6-Month Cleaning',
    annual_checkup:    'Annual Checkup',
    followup:          'Follow-Up',
    custom:            'Custom',
  }

  const statusColor: Record<string, string> = {
    draft:     'text-muted-foreground',
    active:    'text-green-600',
    paused:    'text-yellow-600',
    completed: 'text-blue-600',
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/recalls"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{campaign.campaign_name}</h1>
            <Badge variant="outline">{campaignTypeLabels[campaign.campaign_type] ?? campaign.campaign_type}</Badge>
            <span className={`text-sm font-medium capitalize ${statusColor[campaign.status] ?? ''}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Targeting patients {campaign.target_recall_months}+ months overdue for recall
            {campaign.started_at && ` · Started ${new Date(campaign.started_at).toLocaleDateString()}`}
          </p>
        </div>
        <CampaignActions campaign={{ id: campaign.id, status: campaign.status }} />
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Patients',      value: campaign.total_patients || 0,      icon: Users,         color: '' },
          { label: 'Contacted',           value: campaign.contacted_count || 0,     icon: Phone,         color: 'text-blue-600' },
          { label: 'Appointments Booked', value: campaign.appointments_booked || 0, icon: CalendarCheck, color: 'text-green-600' },
          { label: 'Success Rate',        value: campaign.success_rate != null ? `${Math.round(campaign.success_rate)}%` : '—', icon: Clock, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color || 'text-primary'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${contactStatusColors[status]}`}>
            <span>{contactStatusLabels[status]}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Patient list */}
      <Card>
        <CardHeader>
          <CardTitle>Patients in Campaign</CardTitle>
          <CardDescription>
            {campaignPatients?.length ?? 0} patients · Updated automatically as Make.com processes recall calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!campaignPatients?.length ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No patients yet.{campaign.status === 'draft' ? ' Activate the campaign to populate patients.' : ''}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Recall Due</TableHead>
                  <TableHead>Contact Status</TableHead>
                  <TableHead>Last Attempted</TableHead>
                  <TableHead>Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignPatients.map((cp) => {
                  const patient = cp.patients as {
                    id: string; first_name: string; last_name: string;
                    phone: string | null; email: string | null;
                    last_visit_date: string | null; recall_due_date: string | null
                  } | null

                  return (
                    <TableRow key={cp.id}>
                      <TableCell>
                        {patient ? (
                          <Link href={`/patients/${patient.id}`}
                            className="font-medium hover:underline text-primary">
                            {patient.first_name} {patient.last_name}
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patient?.phone ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patient?.last_visit_date
                          ? new Date(patient.last_visit_date).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patient?.recall_due_date
                          ? new Date(patient.recall_due_date).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contactStatusColors[cp.contact_status] ?? ''}`}>
                          {contactStatusLabels[cp.contact_status] ?? cp.contact_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cp.last_contact_attempt
                          ? new Date(cp.last_contact_attempt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cp.contact_attempts ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
