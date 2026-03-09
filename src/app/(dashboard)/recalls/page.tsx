import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AddCampaignDialog } from '@/components/recalls/add-campaign-dialog'
import { CampaignActions } from '@/components/recalls/campaign-actions'
import { Megaphone, Users, CalendarCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'


const statusColors: Record<string, string> = {
  draft:     'text-muted-foreground',
  active:    'text-green-600',
  paused:    'text-yellow-600',
  completed: 'text-blue-600',
}

const campaignTypeLabels: Record<string, string> = {
  '6month_cleaning': '6-Month Cleaning',
  annual_checkup:    'Annual Checkup',
  followup:          'Follow-Up',
  custom:            'Custom',
}

export default async function RecallsPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const [{ data: campaigns }, { count: activeCampaigns }] = await Promise.all([
    supabase
      .from('recall_campaigns')
      .select('*')
      .eq('practice_id', practiceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('recall_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)
      .eq('status', 'active'),
  ])

  const totalBooked   = campaigns?.reduce((sum, c) => sum + (c.appointments_booked || 0), 0) || 0
  const totalPatients = campaigns?.reduce((sum, c) => sum + (c.total_patients || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recall Campaigns</h1>
          <p className="text-muted-foreground">AI-driven patient recall & reactivation campaigns</p>
        </div>
        <AddCampaignDialog practiceId={practiceId} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Megaphone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCampaigns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients Reached</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments Booked</CardTitle>
            <CalendarCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalBooked}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Campaigns run automatically via Make.com on a daily schedule. Activate a campaign to begin outreach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!campaigns?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No recall campaigns yet</p>
              <p className="text-sm mt-1">
                Create a campaign to start automatically reaching out to patients due for recall.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recall Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Contacted</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const contactedPct =
                    campaign.total_patients > 0
                      ? Math.round(((campaign.contacted_count || 0) / campaign.total_patients) * 100)
                      : 0

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {campaignTypeLabels[campaign.campaign_type] || campaign.campaign_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.target_recall_months}+ months
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium capitalize ${statusColors[campaign.status] || ''}`}>
                          {campaign.status}
                        </span>
                      </TableCell>
                      <TableCell>{campaign.total_patients || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{campaign.contacted_count || 0}</span>
                          {campaign.total_patients > 0 && (
                            <span className="text-xs text-muted-foreground">({contactedPct}%)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${(campaign.appointments_booked || 0) > 0 ? 'text-green-600' : ''}`}>
                          {campaign.appointments_booked || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {campaign.success_rate != null ? (
                          <Badge variant={campaign.success_rate >= 20 ? 'default' : 'outline'}>
                            {Math.round(campaign.success_rate)}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.started_at
                          ? new Date(campaign.started_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <CampaignActions campaign={{ id: campaign.id, status: campaign.status }} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/recalls/${campaign.id}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
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
