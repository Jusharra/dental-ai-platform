'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Phone,
  Shield,
  FileText,
  Handshake,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  ClipboardList,
  Beaker,
  AlertOctagon,
  Megaphone,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Call Logs', href: '/calls', icon: Phone },
  { name: 'Insurance', href: '/insurance', icon: CreditCard },
  { name: 'Recall Campaigns', href: '/recalls', icon: Megaphone },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
]

const complianceNav = [
  { name: 'Overview', href: '/compliance', icon: Shield },
  { name: 'Policies', href: '/compliance/policies', icon: FileText },
  { name: 'BAAs', href: '/compliance/baas', icon: Handshake },
  { name: 'Training', href: '/compliance/training', icon: GraduationCap },
  { name: 'Licenses', href: '/compliance/licenses', icon: Award },
  { name: 'Risk Assessments', href: '/compliance/risk-assessments', icon: ClipboardList },
  { name: 'Sterilization', href: '/compliance/sterilization', icon: Beaker },
  { name: 'Incidents', href: '/compliance/incidents', icon: AlertOctagon },
]

interface SidebarProps {
  user: {
    full_name: string
    email: string
    role: string
    practices?: { name: string } | null
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <>
      <div className="p-6">
        <h2 className="text-lg font-bold text-primary">Dental AI</h2>
        <p className="text-xs text-muted-foreground truncate">
          {user?.practices?.name || 'Practice'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Compliance
        </p>
        <div className="space-y-1">
          {complianceNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <Link href="/settings" onClick={() => setMobileOpen(false)}>
          <Button
            variant={pathname === '/settings' ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              pathname === '/settings' && 'bg-primary/10 text-primary'
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r flex flex-col transition-transform md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-background flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
