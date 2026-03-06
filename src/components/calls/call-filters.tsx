'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

export function CallFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleFilter(key: string, value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/calls?${params.toString()}`)
  }

  function handleClear() {
    router.push('/calls')
  }

  const hasFilters = searchParams.get('type') || searchParams.get('outcome')

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        value={searchParams.get('type') || 'all'}
        onValueChange={(v) => handleFilter('type', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Call Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
          <SelectItem value="recall">Recall</SelectItem>
          <SelectItem value="confirmation_7day">Confirmation (7 day)</SelectItem>
          <SelectItem value="confirmation_3day">Confirmation (3 day)</SelectItem>
          <SelectItem value="confirmation_1day">Confirmation (1 day)</SelectItem>
          <SelectItem value="reminder_3hour">Reminder (3 hour)</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('outcome') || 'all'}
        onValueChange={(v) => handleFilter('outcome', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Outcomes</SelectItem>
          <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
          <SelectItem value="appointment_confirmed">Confirmed</SelectItem>
          <SelectItem value="appointment_declined">Declined</SelectItem>
          <SelectItem value="no_answer">No Answer</SelectItem>
          <SelectItem value="voicemail">Voicemail</SelectItem>
          <SelectItem value="callback_requested">Callback Requested</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
