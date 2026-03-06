'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ROLES = ['practice_owner', 'manager', 'staff'] as const

export function UserActionsCell({
  userId,
  isActive,
  currentRole,
}: {
  userId: string
  isActive: boolean
  currentRole: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function toggleActive() {
    setLoading(true)
    await supabase.from('users').update({ is_active: !isActive }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  async function changeRole(role: string) {
    setLoading(true)
    setOpen(false)
    await supabase.from('users').update({ role }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  // Don't allow editing super_admin accounts
  if (currentRole === 'super_admin') return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-lg border transition disabled:opacity-40 ${
          isActive
            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
        }`}
      >
        {loading ? '…' : isActive ? 'Deactivate' : 'Activate'}
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition"
        >
          Role ▾
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 min-w-36">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition capitalize ${
                    currentRole === r ? 'text-orange-400' : 'text-slate-300'
                  }`}
                >
                  {r.replace(/_/g, ' ')}
                  {currentRole === r && ' ✓'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}