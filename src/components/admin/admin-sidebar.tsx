'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard, Building2, Users, FileText,
  Settings, LogOut, Shield, Menu, X, BarChart3,
} from 'lucide-react'
import { useState } from 'react'

const nav = [
  { name: 'Overview',   href: '/admin/dashboard',  icon: LayoutDashboard },
  { name: 'Practices',  href: '/admin/practices',   icon: Building2       },
  { name: 'Users',      href: '/admin/users',       icon: Users           },
  { name: 'Reports',    href: '/admin/reports',     icon: BarChart3       },
  { name: 'Audit Logs', href: '/admin/audit-logs',  icon: FileText        },
  { name: 'Security',   href: '/admin/security',    icon: Shield          },
  { name: 'Settings',   href: '/admin/settings',    icon: Settings        },
]

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const content = (
    <>
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Admin Portal</p>
            <p className="text-xs text-slate-500 mt-0.5">First-Choice Cyber</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <span className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-orange-500/10 text-orange-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-semibold text-xs">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{adminName}</p>
            <p className="text-[11px] text-slate-500">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition w-full px-1"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-56 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>

      {/* Desktop */}
      <aside className="hidden md:flex w-56 bg-slate-950 border-r border-slate-800 flex-col shrink-0">
        {content}
      </aside>
    </>
  )
}