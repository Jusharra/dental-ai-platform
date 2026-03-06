'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function AddPolicyDialog({ practiceId }: { practiceId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from('compliance_policies').insert({
      practice_id: practiceId,
      title: formData.get('title') as string,
      policy_type: formData.get('policy_type') as string,
      content: formData.get('content') as string,
      version: formData.get('version') as string,
      effective_date: formData.get('effective_date') as string,
      next_review_date: (formData.get('next_review_date') as string) || null,
      status: formData.get('status') as string,
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
        <Button><Plus className="mr-2 h-4 w-4" /> Add Policy</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Policy</DialogTitle>
          <DialogDescription>Create a new compliance policy.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policy_type">Type *</Label>
                <Select name="policy_type" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipaa_privacy">HIPAA Privacy</SelectItem>
                    <SelectItem value="hipaa_security">HIPAA Security</SelectItem>
                    <SelectItem value="hipaa_breach_notification">HIPAA Breach Notification</SelectItem>
                    <SelectItem value="osha_bloodborne_pathogens">OSHA Bloodborne Pathogens</SelectItem>
                    <SelectItem value="osha_hazard_communication">OSHA Hazard Communication</SelectItem>
                    <SelectItem value="infection_control">Infection Control</SelectItem>
                    <SelectItem value="emergency_response">Emergency Response</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input id="version" name="version" defaultValue="1.0" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date *</Label>
                <Input id="effective_date" name="effective_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_review_date">Next Review Date</Label>
                <Input id="next_review_date" name="next_review_date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="draft">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Policy Content *</Label>
              <Textarea id="content" name="content" rows={8} required />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Policy'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
