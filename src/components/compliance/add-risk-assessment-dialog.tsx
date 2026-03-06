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

export function AddRiskAssessmentDialog({ practiceId }: { practiceId: string }) {
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
    const score = form.get('overall_score') ? parseInt(form.get('overall_score') as string) : null

    const { error } = await supabase.from('risk_assessments').insert({
      practice_id: practiceId,
      assessment_type: form.get('assessment_type') as string,
      assessment_date: form.get('assessment_date') as string,
      overall_score: score,
      risk_level: form.get('risk_level') as string || null,
      status: 'in_progress',
      remediation_status: 'not_started',
    })

    if (error) { setError(error.message) }
    else { setOpen(false); router.refresh() }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Assessment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Risk Assessment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Assessment Type</Label>
            <Select name="assessment_type" required>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hipaa_security">HIPAA Security</SelectItem>
                <SelectItem value="osha_safety">OSHA Safety</SelectItem>
                <SelectItem value="general_risk">General Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment_date">Assessment Date</Label>
            <Input id="assessment_date" name="assessment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overall_score">Score (0–100)</Label>
              <Input id="overall_score" name="overall_score" type="number" min="0" max="100" placeholder="e.g. 78" />
            </div>
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select name="risk_level">
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
