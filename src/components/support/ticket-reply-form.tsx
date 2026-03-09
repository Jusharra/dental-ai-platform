'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TicketReplyFormProps {
  ticketId: string
  isResolved?: boolean
}

export function TicketReplyForm({ ticketId, isResolved }: TicketReplyFormProps) {
  const router  = useRouter()
  const [body, setBody]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send reply.')
      setLoading(false)
      return
    }

    setBody('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isResolved && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          This ticket is resolved. Sending a reply will reopen it.
        </p>
      )}
      <Textarea
        placeholder="Write your reply…"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !body.trim()}>
          {loading ? 'Sending…' : 'Send Reply'}
        </Button>
      </div>
    </form>
  )
}
