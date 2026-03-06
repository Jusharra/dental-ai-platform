'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function AddTrainingDialog({ practiceId }: { practiceId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      supabase
        .from('users')
        .select('id, full_name')
        .eq('practice_id', practiceId)
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) => { if (data) setUsers(data) })
    }
  }, [open, practiceId, supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from('training_records').insert({
      practice_id: practiceId,
      user_id: formData.get('user_id') as string,
      training_type: formData.get('training_type') as string,
      training_name: formData.get('training_name') as string,
      training_date: formData.get('training_date') as string,
      hours: parseFloat(formData.get('hours') as string) || null,
      instructor_name: (formData.get('instructor_name') as string) || null,
      training_provider: (formData.get('training_provider') as string) || null,
      expiration_date: (formData.get('expiration_date') as string) || null,
      status: 'completed',
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
        <Button><Plus className="mr-2 h-4 w-4" /> Add Training Record</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Training Record</DialogTitle>
          <DialogDescription>Record a staff training completion.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Staff Member *</Label>
              <Select name="user_id" required>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="training_name">Training Name *</Label>
              <Input id="training_name" name="training_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training_type">Type *</Label>
              <Select name="training_type" required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipaa_annual">HIPAA Annual</SelectItem>
                  <SelectItem value="osha_bloodborne_pathogens">OSHA Bloodborne Pathogens</SelectItem>
                  <SelectItem value="osha_hazard_communication">OSHA Hazard Communication</SelectItem>
                  <SelectItem value="cpr_bls">CPR/BLS</SelectItem>
                  <SelectItem value="acls">ACLS</SelectItem>
                  <SelectItem value="fire_safety">Fire Safety</SelectItem>
                  <SelectItem value="infection_control">Infection Control</SelectItem>
                  <SelectItem value="radiology_safety">Radiology Safety</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="training_date">Training Date *</Label>
                <Input id="training_date" name="training_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" name="hours" type="number" step="0.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor_name">Instructor</Label>
                <Input id="instructor_name" name="instructor_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="training_provider">Provider</Label>
                <Input id="training_provider" name="training_provider" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input id="expiration_date" name="expiration_date" type="date" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Record'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
