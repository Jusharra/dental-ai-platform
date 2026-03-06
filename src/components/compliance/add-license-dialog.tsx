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

export function AddLicenseDialog({ practiceId }: { practiceId: string }) {
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
    const { error } = await supabase.from('licenses_credentials').insert({
      practice_id: practiceId,
      user_id: formData.get('user_id') as string,
      credential_type: formData.get('credential_type') as string,
      credential_name: formData.get('credential_name') as string,
      credential_number: (formData.get('credential_number') as string) || null,
      issuing_authority: (formData.get('issuing_authority') as string) || null,
      issuing_state: (formData.get('issuing_state') as string) || null,
      issue_date: (formData.get('issue_date') as string) || null,
      expiration_date: (formData.get('expiration_date') as string) || null,
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
        <Button><Plus className="mr-2 h-4 w-4" /> Add License</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add License / Credential</DialogTitle>
          <DialogDescription>Track a professional license or certification.</DialogDescription>
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
              <Label htmlFor="credential_name">Credential Name *</Label>
              <Input id="credential_name" name="credential_name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credential_type">Type *</Label>
                <Select name="credential_type" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dental_license">Dental License</SelectItem>
                    <SelectItem value="hygienist_license">Hygienist License</SelectItem>
                    <SelectItem value="dea_registration">DEA Registration</SelectItem>
                    <SelectItem value="npi_number">NPI Number</SelectItem>
                    <SelectItem value="cpr_certification">CPR Certification</SelectItem>
                    <SelectItem value="acls_certification">ACLS Certification</SelectItem>
                    <SelectItem value="radiology_certification">Radiology Certification</SelectItem>
                    <SelectItem value="specialty_board_certification">Specialty Board</SelectItem>
                    <SelectItem value="malpractice_insurance">Malpractice Insurance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential_number">Credential Number</Label>
                <Input id="credential_number" name="credential_number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuing_authority">Issuing Authority</Label>
                <Input id="issuing_authority" name="issuing_authority" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuing_state">State</Label>
                <Input id="issuing_state" name="issuing_state" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input id="issue_date" name="issue_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input id="expiration_date" name="expiration_date" type="date" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add License'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
