'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'

export function ImpersonateButton({ practiceId, practiceName }: { practiceId: string; practiceName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleImpersonate() {
    setLoading(true)
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ practice_id: practiceId }),
    })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleImpersonate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-sm font-medium rounded-xl transition disabled:opacity-50"
    >
      <Eye className="w-4 h-4" />
      {loading ? 'Loading…' : `View as ${practiceName}`}
    </button>
  )
}