'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function ImpersonationBanner({ practiceName }: { practiceName: string }) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  async function handleExit() {
    setExiting(true)
    await fetch('/api/admin/impersonate', { method: 'DELETE' })
    router.push('/admin/practices')
    router.refresh()
  }

  return (
    <div className="bg-orange-500 text-white text-sm px-4 py-2 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          Viewing as: <strong>{practiceName}</strong>
          <span className="font-normal opacity-80 ml-1">— You are in impersonation mode</span>
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-1 rounded-full text-xs font-semibold shrink-0"
      >
        <X className="w-3.5 h-3.5" />
        {exiting ? 'Exiting…' : 'Exit Impersonation'}
      </button>
    </div>
  )
}