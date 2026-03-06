import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, Clock, AlertCircle, CreditCard, ArrowRight } from 'lucide-react'

export default async function InsurancePage() {
  const supabase = createClient()

  const { data: verifications } = await supabase
    .from('insurance_verifications')
    .select('*, patients(patient_name, phone, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  const all = verifications ?? []

  const pending_patient = all.filter((v) => v.status === 'pending_patient').length
  const pending_staff   = all.filter((v) => v.status === 'pending_staff').length
  const verified        = all.filter((v) => v.status === 'verified').length
  const expired         = all.filter((v) => v.status === 'expired').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insurance Verification</h1>
        <p className="text-muted-foreground mt-1">Track and complete patient insurance verifications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-500" />} label="Awaiting Patient" value={pending_patient} color="yellow" />
        <StatCard icon={<AlertCircle className="w-5 h-5 text-orange-500" />} label="Needs Review" value={pending_staff} color="orange" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-500" />} label="Verified" value={verified} color="green" />
        <StatCard icon={<CreditCard className="w-5 h-5 text-slate-400" />} label="Expired" value={expired} color="slate" />
      </div>

      {/* Needs Review — priority list */}
      {pending_staff > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Needs Staff Review ({pending_staff})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VerificationTable rows={all.filter((v) => v.status === 'pending_staff')} />
          </CardContent>
        </Card>
      )}

      {/* All verifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Verifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {all.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No verifications yet.</p>
              <p className="text-xs mt-1">Send a verification form from a patient&apos;s profile to get started.</p>
            </div>
          ) : (
            <VerificationTable rows={all} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const bg: Record<string, string> = {
    yellow: 'bg-yellow-500/10',
    orange: 'bg-orange-500/10',
    green: 'bg-green-500/10',
    slate: 'bg-slate-100',
  }
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bg[color]} rounded-xl flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type VerificationRow = {
  id: string
  status: string
  p_insurance_carrier: string | null
  p_member_id: string | null
  sent_to_email: string | null
  created_at: string
  patient_submitted_at: string | null
  staff_verified_at: string | null
  patient_id: string
  patients: { patient_name: string; phone: string; email: string | null } | null
}

function VerificationTable({ rows }: { rows: VerificationRow[] }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_patient: { label: 'Awaiting Patient', variant: 'secondary' },
    pending_staff:   { label: 'Needs Review',     variant: 'default'   },
    verified:        { label: 'Verified',          variant: 'default'   },
    expired:         { label: 'Expired',           variant: 'destructive' },
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Insurance Carrier</TableHead>
          <TableHead>Sent To</TableHead>
          <TableHead>Date Sent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((v) => {
          const config = statusConfig[v.status] ?? { label: v.status, variant: 'outline' }
          return (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.patients?.patient_name ?? '—'}</TableCell>
              <TableCell>{v.p_insurance_carrier || <span className="text-muted-foreground text-xs">Not provided yet</span>}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{v.sent_to_email || '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{v.created_at.split('T')[0]}</TableCell>
              <TableCell>
                <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/patients/${v.patient_id}?tab=insurance`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
