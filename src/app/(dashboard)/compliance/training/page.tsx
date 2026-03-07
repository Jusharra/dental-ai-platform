import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddTrainingDialog } from '@/components/compliance/add-training-dialog'

export default async function TrainingPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: records } = await supabase
    .from('training_records')
    .select('*, users(full_name)')
    .eq('practice_id', practiceId)
    .order('training_date', { ascending: false })

  const trainingTypeLabels: Record<string, string> = {
    hipaa_annual: 'HIPAA Annual',
    osha_bloodborne_pathogens: 'OSHA Bloodborne Pathogens',
    osha_hazard_communication: 'OSHA Hazard Communication',
    cpr_bls: 'CPR/BLS',
    acls: 'ACLS',
    fire_safety: 'Fire Safety',
    infection_control: 'Infection Control',
    radiology_safety: 'Radiology Safety',
    custom: 'Custom',
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/compliance">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Training Records</h1>
            <p className="text-muted-foreground">Staff training and certifications</p>
          </div>
        </div>
        <AddTrainingDialog practiceId={practiceId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!records?.length ? (
            <p className="text-center py-12 text-muted-foreground">No training records yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const isExpired = record.expiration_date && record.expiration_date < today
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {(record.users as unknown as { full_name: string })?.full_name || '—'}
                      </TableCell>
                      <TableCell>{record.training_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trainingTypeLabels[record.training_type] || record.training_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.training_date}</TableCell>
                      <TableCell>{record.hours || '—'}</TableCell>
                      <TableCell>
                        <span className={isExpired ? 'text-destructive font-medium' : ''}>
                          {record.expiration_date || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'completed' ? 'default' :
                          record.status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {record.status.replace(/_/g, ' ')}
                        </Badge>
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
