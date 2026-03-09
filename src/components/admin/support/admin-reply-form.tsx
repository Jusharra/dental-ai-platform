'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminReplyForm({ ticketId }: { ticketId: string }) {
  const router      = useRouter()
  const [body, setBody]           = useState('')
  const [isInternal, setInternal] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim(), is_internal: isInternal }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send.')
      setLoading(false)
      return
    }

    setBody('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={isInternal ? 'Internal note (not visible to practice)…' : 'Write your reply…'}
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
        className={cn(
          'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500',
          isInternal && 'border-yellow-600/50 bg-yellow-950/20'
        )}
      />

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={e => setInternal(e.target.checked)}
            className="rounded border-slate-600"
          />
          <Lock className="h-3.5 w-3.5 text-yellow-500" />
          <Label className="text-xs text-slate-400 cursor-pointer">Internal note (hidden from practice)</Label>
        </label>

        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            size="sm"
            disabled={loading || !body.trim()}
            className={isInternal ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
          >
            {loading ? 'Sending…' : isInternal ? 'Save Note' : 'Send Reply'}
          </Button>
        </div>
      </div>
    </form>
  )
}
