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

export function AddCampaignDialog({ practiceId }: { practiceId: string }) {
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
    const recallMonths = parseInt(form.get('target_recall_months') as string)

    const { error } = await supabase.from('recall_campaigns').insert({
      practice_id: practiceId,
      campaign_name: form.get('campaign_name') as string,
      campaign_type: form.get('campaign_type') as string,
      target_recall_months: isNaN(recallMonths) ? 6 : recallMonths,
      status: 'draft',
    })

    if (error) { setError(error.message) }
    else { setOpen(false); router.refresh() }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Recall Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="campaign_name">Campaign Name</Label>
            <Input
              id="campaign_name"
              name="campaign_name"
              required
              placeholder="e.g. Q1 6-Month Recall"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select name="campaign_type" required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6month_cleaning">6-Month Cleaning</SelectItem>
                  <SelectItem value="annual_checkup">Annual Checkup</SelectItem>
                  <SelectItem value="followup">Follow-Up</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_recall_months">Recall Window (months)</Label>
              <Input
                id="target_recall_months"
                name="target_recall_months"
                type="number"
                min="1"
                max="24"
                defaultValue="6"
                placeholder="6"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Patients whose last visit was at least this many months ago will be targeted by Make.com when this campaign is active.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Campaign'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
