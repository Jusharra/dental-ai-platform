import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PatientSearch } from '@/components/patients/patient-search'
import { PatientTable } from '@/components/patients/patient-table'
import { AddPatientDialog } from '@/components/patients/add-patient-dialog'

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize
  const search = searchParams.search || ''
  const statusFilter = searchParams.status || ''

  let query = supabase
    .from('patients')
    .select(
      'id, patient_name, first_name, last_name, phone, email, status, last_visit_date, recall_due_date, created_at',
      { count: 'exact' }
    )
    .eq('practice_id', practiceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (search) {
    query = query.or(`patient_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: patients, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            Manage your patient records
            {count !== null && <Badge variant="secondary" className="ml-2">{count} total</Badge>}
          </p>
        </div>
        <AddPatientDialog practiceId={practiceId} />
      </div>

      <Card>
        <CardHeader>
          <PatientSearch />
        </CardHeader>
        <CardContent>
          <PatientTable patients={(patients || []) as any} currentPage={page} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  )
}
