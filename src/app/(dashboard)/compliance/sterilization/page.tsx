import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { AddSterilizationLogDialog } from '@/components/compliance/add-sterilization-log-dialog'

export default async function SterilizationPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const [{ data: logs }, { count: totalTests }, { count: failedTests }] = await Promise.all([
    supabase
      .from('sterilization_logs')
      .select('*')
      .eq('practice_id', practiceId)
      .order('test_date', { ascending: false })
      .limit(100),
    supabase
      .from('sterilization_logs')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId),
    supabase
      .from('sterilization_logs')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)
      .eq('result', 'fail'),
  ])

  const passRate = totalTests ? Math.round(((totalTests - (failedTests || 0)) / totalTests) * 100) : 100

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
            <h1 className="text-3xl font-bold">Sterilization Logs</h1>
            <p className="text-muted-foreground">Infection control & autoclave testing records</p>
          </div>
        </div>
        <AddSterilizationLogDialog practiceId={practiceId} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTests || 0}</div>
            <p className="text-sm text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${(failedTests || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {failedTests || 0}
            </div>
            <p className="text-sm text-muted-foreground">Failed Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${passRate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {passRate}%
            </div>
            <p className="text-sm text-muted-foreground">Pass Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!logs?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">No sterilization logs recorded</p>
              <p className="text-sm mt-1">Start logging autoclave and sterilization tests.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Corrective Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className={log.result === 'fail' ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{log.test_date}</TableCell>
                    <TableCell>
                      <div className="text-sm">{log.equipment_id || '—'}</div>
                      {log.equipment_type && (
                        <div className="text-xs text-muted-foreground capitalize">
                          {log.equipment_type.replace(/_/g, ' ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.test_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.result === 'pass' ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Pass
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <XCircle className="h-4 w-4" /> Fail
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.batch_number || '—'}</TableCell>
                    <TableCell className="text-sm">{log.technician_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.corrective_action || '—'}
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
