import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
