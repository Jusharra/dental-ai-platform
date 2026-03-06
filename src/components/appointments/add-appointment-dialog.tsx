'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface AddAppointmentDialogProps {
  practiceId: string
}

export function AddAppointmentDialog({ practiceId }: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('practice_id', practiceId)
        .eq('status', 'active')
        .order('last_name')
        .then(({ data }) => {
          if (data) setPatients(data)
        })
    }
  }, [open, practiceId, supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from('appointments').insert({
      practice_id: practiceId,
      patient_id: formData.get('patient_id') as string,
      provider_name: formData.get('provider_name') as string,
      appointment_date: formData.get('appointment_date') as string,
      appointment_time: formData.get('appointment_time') as string,
      duration_minutes: parseInt(formData.get('duration_minutes') as string) || 60,
      procedure_type: (formData.get('procedure_type') as string) || null,
      procedure_reason: (formData.get('procedure_reason') as string) || null,
      notes: (formData.get('notes') as string) || null,
      status: 'scheduled',
      confirmation_status: 'pending',
    })

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Schedule a new appointment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient *</Label>
              <Select name="patient_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider_name">Provider *</Label>
              <Input id="provider_name" name="provider_name" placeholder="Dr. Smith" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Date *</Label>
                <Input id="appointment_date" name="appointment_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment_time">Time *</Label>
                <Input id="appointment_time" name="appointment_time" type="time" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (min)</Label>
                <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue="60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedure_type">Procedure</Label>
                <Select name="procedure_type">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="filling">Filling</SelectItem>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="root_canal">Root Canal</SelectItem>
                    <SelectItem value="extraction">Extraction</SelectItem>
                    <SelectItem value="whitening">Whitening</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
