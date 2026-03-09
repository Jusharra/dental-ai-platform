import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const service = createServiceClient()
  const cookieStore = cookies()
  const impersonatingId = cookieStore.get('admin_impersonating')?.value ?? null

  // Run profile + ticket count in parallel
  const [{ data: profile }, { count: openTicketCount }] = await Promise.all([
    supabase.from('users').select('role, full_name').eq('id', user.id).single(),
    service.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Impersonation name lookup (conditional — only when cookie is set)
  let impersonatedPracticeName: string | null = null
  if (impersonatingId) {
    const { data: practice } = await service
      .from('practices')
      .select('name')
      .eq('id', impersonatingId)
      .single()
    impersonatedPracticeName = practice?.name ?? null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AdminSidebar adminName={profile.full_name} openTicketCount={openTicketCount ?? 0} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {impersonatedPracticeName && (
          <ImpersonationBanner practiceName={impersonatedPracticeName} />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-900/50">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
