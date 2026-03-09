'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TicketAdminActionsProps {
  ticketId: string
  currentStatus: string
  currentPriority: string
}

const STATUSES = [
  { value: 'open',        label: 'Open'        },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved'    },
  { value: 'closed',      label: 'Closed'      },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
]

export function TicketAdminActions({ ticketId, currentStatus, currentPriority }: TicketAdminActionsProps) {
  const router   = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(field: 'status' | 'priority', value: string) {
    setSaving(true)
    await fetch(`/api/admin/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <Label className="text-xs text-slate-400">Status</Label>
        <Select
          defaultValue={currentStatus}
          onValueChange={v => handleChange('status', v)}
          disabled={saving}
        >
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-slate-400">Priority</Label>
        <Select
          defaultValue={currentPriority}
          onValueChange={v => handleChange('priority', v)}
          disabled={saving}
        >
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
