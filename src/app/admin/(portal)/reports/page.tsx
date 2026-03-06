import { createServiceClient } from '@/lib/supabase/server'
import { AdminReportsClient } from '@/components/admin/admin-reports-client'

export default async function AdminReportsPage() {
  const service = createServiceClient()
  const { data: practices } = await service
    .from('practices')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400 text-sm mt-0.5">Generate and send reports for any practice</p>
      </div>
      <AdminReportsClient practices={practices ?? []} />
    </div>
  )
}