'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

export function AddIncidentDialog({ practiceId }: { practiceId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)

    const { error } = await supabase.from('incident_logs').insert({
      practice_id: practiceId,
      incident_type: form.get('incident_type') as string,
      incident_date: form.get('incident_date') as string,
      severity: form.get('severity') as string,
      description: form.get('description') as string,
      status: 'open',
      investigation_status: 'not_started',
      remediation_status: 'not_started',
      reported_to_regulator: false,
    })

    if (error) { setError(error.message) }
    else { setOpen(false); router.refresh() }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive"><Plus className="h-4 w-4 mr-2" /> Report Incident</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type</Label>
              <Select name="incident_type" required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipaa_breach">HIPAA Breach</SelectItem>
                  <SelectItem value="osha_sharps_injury">OSHA Sharps Injury</SelectItem>
                  <SelectItem value="osha_exposure">OSHA Exposure</SelectItem>
                  <SelectItem value="patient_safety">Patient Safety</SelectItem>
                  <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                  <SelectItem value="medication_error">Medication Error</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select name="severity" required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident_date">Incident Date</Label>
            <Input id="incident_date" name="incident_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required rows={4} placeholder="Describe what happened, who was affected, and immediate actions taken..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={loading}>{loading ? 'Reporting...' : 'Report Incident'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
