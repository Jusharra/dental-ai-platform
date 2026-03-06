'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'

interface AppointmentActionsProps {
  appointmentId: string
  currentStatus: string
}

export function AppointmentActions({ appointmentId, currentStatus }: AppointmentActionsProps) {
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(status: string) {
    await supabase
      .from('appointments')
      .update({
        status,
        ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
      })
      .eq('id', appointmentId)

    router.refresh()
  }

  async function updateConfirmation(confirmationStatus: string) {
    await supabase
      .from('appointments')
      .update({
        confirmation_status: confirmationStatus,
        confirmation_date: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => updateConfirmation('confirmed')}>
          <CheckCircle className="mr-2 h-4 w-4" /> Mark Confirmed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateStatus('completed')}>
          <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updateStatus('no_show')}>
          <Clock className="mr-2 h-4 w-4" /> Mark No-Show
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateStatus('cancelled')}
          className="text-destructive"
        >
          <Ban className="mr-2 h-4 w-4" /> Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
