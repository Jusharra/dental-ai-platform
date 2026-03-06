import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddRiskAssessmentDialog } from '@/components/compliance/add-risk-assessment-dialog'

const riskLevelVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'default',
  medium: 'secondary',
  high: 'outline',
  critical: 'destructive',
}

const statusColors: Record<string, string> = {
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  approved: 'text-purple-600',
}

export default async function RiskAssessmentsPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: assessments } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('practice_id', practiceId)
    .order('assessment_date', { ascending: false })

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
            <h1 className="text-3xl font-bold">Risk Assessments</h1>
            <p className="text-muted-foreground">HIPAA Security Risk Analysis records</p>
          </div>
        </div>
        <AddRiskAssessmentDialog practiceId={practiceId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!assessments?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">No risk assessments recorded</p>
              <p className="text-sm mt-1">Add your first HIPAA Security Risk Analysis to stay compliant.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remediation</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.assessment_date}</TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">
                        {a.assessment_type.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.risk_level ? (
                        <Badge variant={riskLevelVariant[a.risk_level] || 'outline'}>
                          {a.risk_level}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {a.overall_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                a.overall_score >= 80 ? 'bg-green-500' :
                                a.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${a.overall_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{a.overall_score}/100</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm capitalize font-medium ${statusColors[a.status] || ''}`}>
                        {a.status?.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {a.remediation_status?.replace(/_/g, ' ') || 'not started'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {a.report_url ? (
                        <a href={a.report_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline">
                          View report
                        </a>
                      ) : '—'}
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
