import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddPolicyDialog } from '@/components/compliance/add-policy-dialog'

export default async function PoliciesPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: policies } = await supabase
    .from('compliance_policies')
    .select('*')
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false })

  const policyTypeLabels: Record<string, string> = {
    hipaa_privacy: 'HIPAA Privacy',
    hipaa_security: 'HIPAA Security',
    hipaa_breach_notification: 'HIPAA Breach Notification',
    osha_bloodborne_pathogens: 'OSHA Bloodborne Pathogens',
    osha_hazard_communication: 'OSHA Hazard Communication',
    infection_control: 'Infection Control',
    emergency_response: 'Emergency Response',
    custom: 'Custom',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/compliance">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Policies</h1>
            <p className="text-muted-foreground">HIPAA & OSHA compliance policies</p>
          </div>
        </div>
        <AddPolicyDialog practiceId={practiceId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!policies?.length ? (
            <p className="text-center py-12 text-muted-foreground">No policies added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {policyTypeLabels[policy.policy_type] || policy.policy_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy.version}</TableCell>
                    <TableCell>{policy.effective_date}</TableCell>
                    <TableCell>{policy.next_review_date || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        policy.status === 'active' ? 'default' :
                        policy.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {policy.status}
                      </Badge>
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
