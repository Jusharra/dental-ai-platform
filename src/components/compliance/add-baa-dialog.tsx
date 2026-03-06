'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function AddBAADialog({ practiceId }: { practiceId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRenews, setAutoRenews] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from('business_associate_agreements').insert({
      practice_id: practiceId,
      vendor_name: formData.get('vendor_name') as string,
      vendor_contact_name: (formData.get('vendor_contact_name') as string) || null,
      vendor_email: (formData.get('vendor_email') as string) || null,
      vendor_phone: (formData.get('vendor_phone') as string) || null,
      service_description: formData.get('service_description') as string,
      service_category: (formData.get('service_category') as string) || null,
      execution_date: formData.get('execution_date') as string,
      expiration_date: (formData.get('expiration_date') as string) || null,
      auto_renews: autoRenews,
      status: 'active',
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
        <Button><Plus className="mr-2 h-4 w-4" /> Add BAA</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Business Associate Agreement</DialogTitle>
          <DialogDescription>Track a new vendor BAA.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input id="vendor_name" name="vendor_name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_contact_name">Contact Name</Label>
                <Input id="vendor_contact_name" name="vendor_contact_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_email">Contact Email</Label>
                <Input id="vendor_email" name="vendor_email" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_description">Service Description *</Label>
              <Input id="service_description" name="service_description" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_category">Category</Label>
              <Input id="service_category" name="service_category" placeholder="e.g., EHR, Cloud Storage, AI Platform" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="execution_date">Execution Date *</Label>
                <Input id="execution_date" name="execution_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input id="expiration_date" name="expiration_date" type="date" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto_renews" checked={autoRenews} onCheckedChange={(v) => setAutoRenews(v === true)} />
              <Label htmlFor="auto_renews" className="font-normal">Auto-renews</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add BAA'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
