'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

export function AddSterilizationLogDialog({ practiceId }: { practiceId: string }) {
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

    const { error } = await supabase.from('sterilization_logs').insert({
      practice_id: practiceId,
      test_date: form.get('test_date') as string,
      equipment_id: (form.get('equipment_id') as string) || null,
      equipment_type: (form.get('equipment_type') as string) || null,
      test_type: form.get('test_type') as string,
      result: form.get('result') as string,
      batch_number: (form.get('batch_number') as string) || null,
      technician_name: form.get('technician_name') as string,
      corrective_action: (form.get('corrective_action') as string) || null,
    })

    if (error) { setError(error.message) }
    else { setOpen(false); router.refresh() }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Log Test</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Sterilization Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_date">Test Date</Label>
              <Input id="test_date" name="test_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select name="result" required>
                <SelectTrigger><SelectValue placeholder="Pass / Fail" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select name="test_type" required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="biological_indicator">Biological Indicator</SelectItem>
                  <SelectItem value="chemical_indicator">Chemical Indicator</SelectItem>
                  <SelectItem value="mechanical_indicator">Mechanical Indicator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipment Type</Label>
              <Select name="equipment_type">
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="steam_autoclave">Steam Autoclave</SelectItem>
                  <SelectItem value="dry_heat">Dry Heat</SelectItem>
                  <SelectItem value="chemical">Chemical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment ID</Label>
              <Input id="equipment_id" name="equipment_id" placeholder="e.g. Autoclave 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch #</Label>
              <Input id="batch_number" name="batch_number" placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="technician_name">Technician Name</Label>
            <Input id="technician_name" name="technician_name" required placeholder="Staff member who performed test" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="corrective_action">Corrective Action (if failed)</Label>
            <Input id="corrective_action" name="corrective_action" placeholder="Leave blank if passed" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
