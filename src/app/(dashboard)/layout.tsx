import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MfaBanner } from '@/components/dashboard/mfa-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const showMfaBanner =
    !profile.mfa_enrolled_at &&
    profile.mfa_grace_period_ends &&
    new Date(profile.mfa_grace_period_ends) > new Date()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {showMfaBanner && (
          <MfaBanner graceEnds={profile.mfa_grace_period_ends!} />
        )}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
