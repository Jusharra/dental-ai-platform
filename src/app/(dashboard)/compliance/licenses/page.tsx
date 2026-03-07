import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddLicenseDialog } from '@/components/compliance/add-license-dialog'

export default async function LicensesPage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const { data: licenses } = await supabase
    .from('licenses_credentials')
    .select('*, users(full_name)')
    .eq('practice_id', practiceId)
    .order('expiration_date')

  const credentialTypeLabels: Record<string, string> = {
    dental_license: 'Dental License',
    hygienist_license: 'Hygienist License',
    dea_registration: 'DEA Registration',
    npi_number: 'NPI Number',
    cpr_certification: 'CPR Certification',
    acls_certification: 'ACLS Certification',
    radiology_certification: 'Radiology Certification',
    specialty_board_certification: 'Specialty Board',
    malpractice_insurance: 'Malpractice Insurance',
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
            <h1 className="text-3xl font-bold">Licenses & Credentials</h1>
            <p className="text-muted-foreground">Track professional licenses and certifications</p>
          </div>
        </div>
        <AddLicenseDialog practiceId={practiceId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!licenses?.length ? (
            <p className="text-center py-12 text-muted-foreground">No licenses added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Credential</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Issuing Authority</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => {
                  const isExpired = license.expiration_date && license.expiration_date < today
                  const isExpiringSoon = license.expiration_date &&
                    license.expiration_date >= today &&
                    license.expiration_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">
                        {(license.users as unknown as { full_name: string })?.full_name || '—'}
                      </TableCell>
                      <TableCell>{license.credential_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {credentialTypeLabels[license.credential_type] || license.credential_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{license.credential_number || '—'}</TableCell>
                      <TableCell>{license.issuing_authority || '—'}</TableCell>
                      <TableCell>
                        <span className={
                          isExpired ? 'text-destructive font-medium' :
                          isExpiringSoon ? 'text-orange-600 font-medium' : ''
                        }>
                          {license.expiration_date || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          license.status === 'active' ? 'default' :
                          license.status === 'expired' ? 'destructive' :
                          license.status === 'suspended' ? 'destructive' : 'secondary'
                        }>
                          {license.status.replace(/_/g, ' ')}
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
