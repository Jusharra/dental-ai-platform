import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddBAADialog } from '@/components/compliance/add-baa-dialog'

export default async function BAAsPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: baas } = await supabase
    .from('business_associate_agreements')
    .select('*')
    .eq('practice_id', practiceId)
    .order('expiration_date')

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/compliance">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Business Associate Agreements</h1>
            <p className="text-muted-foreground">Track vendor BAAs for HIPAA compliance</p>
          </div>
        </div>
        <AddBAADialog practiceId={practiceId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!baas?.length ? (
            <p className="text-center py-12 text-muted-foreground">No BAAs added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Execution Date</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Auto-Renew</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baas.map((baa) => {
                  const isExpiringSoon = baa.expiration_date && baa.expiration_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && baa.expiration_date >= today
                  const isExpired = baa.expiration_date && baa.expiration_date < today

                  return (
                    <TableRow key={baa.id}>
                      <TableCell className="font-medium">{baa.vendor_name}</TableCell>
                      <TableCell>{baa.service_description}</TableCell>
                      <TableCell>{baa.service_category || '—'}</TableCell>
                      <TableCell>{baa.execution_date}</TableCell>
                      <TableCell>
                        <span className={isExpiringSoon ? 'text-orange-600 font-medium' : isExpired ? 'text-destructive font-medium' : ''}>
                          {baa.expiration_date || 'No expiry'}
                        </span>
                      </TableCell>
                      <TableCell>{baa.auto_renews ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          baa.status === 'active' ? 'default' :
                          baa.status === 'expired' ? 'destructive' :
                          baa.status === 'pending_renewal' ? 'secondary' : 'outline'
                        }>
                          {baa.status.replace(/_/g, ' ')}
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
