import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddIncidentDialog } from '@/components/compliance/add-incident-dialog'

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  critical: 'destructive',
}

const statusColors: Record<string, string> = {
  open: 'text-red-600',
  investigating: 'text-yellow-600',
  resolved: 'text-blue-600',
  closed: 'text-green-600',
}

export default async function IncidentsPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const [
    { data: incidents },
    { count: openCount },
    { count: hipaaCount },
  ] = await Promise.all([
    supabase
      .from('incident_logs')
      .select('*')
      .eq('practice_id', practiceId)
      .order('incident_date', { ascending: false }),
    supabase
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)
      .in('status', ['open', 'investigating']),
    supabase
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)
      .eq('incident_type', 'hipaa_breach'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/compliance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Incident Reports</h1>
            <p className="text-muted-foreground">HIPAA breaches, OSHA exposures & patient safety incidents</p>
          </div>
        </div>
        <AddIncidentDialog practiceId={practiceId} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{incidents?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Incidents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${(openCount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {openCount || 0}
            </div>
            <p className="text-sm text-muted-foreground">Open / Investigating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${(hipaaCount || 0) > 0 ? 'text-orange-600' : ''}`}>
              {hipaaCount || 0}
            </div>
            <p className="text-sm text-muted-foreground">HIPAA Breaches</p>
          </CardContent>
        </Card>
      </div>

      {(openCount || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-red-900">
              {openCount} incident{(openCount || 0) > 1 ? 's' : ''} require attention.
              Review and update the investigation status.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {!incidents?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">No incidents recorded</p>
              <p className="text-sm mt-1">Report HIPAA breaches, OSHA exposures, or patient safety incidents here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Investigation</TableHead>
                  <TableHead>Reported to Regulator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-medium">{inc.incident_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {inc.incident_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[inc.severity] || 'outline'} className="capitalize">
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm" title={inc.description}>
                      {inc.description}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium capitalize ${statusColors[inc.status] || ''}`}>
                        {inc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize text-muted-foreground">
                        {inc.investigation_status?.replace(/_/g, ' ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {inc.reported_to_regulator ? (
                        <span className="text-xs text-green-600 font-medium">
                          {inc.regulator_name || 'Yes'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
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
