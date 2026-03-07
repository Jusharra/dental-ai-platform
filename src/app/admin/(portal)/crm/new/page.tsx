import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LeadForm } from '@/components/admin/crm/lead-form'

export default async function NewLeadPage() {
  const service = createServiceClient()
  const { data: specialtyDefaults } = await service
    .from('crm_specialty_defaults')
    .select('specialty, avg_appt_value, after_hours_call_pct, hold_time_abandon_pct, no_show_rate_pct, no_show_multiplier')
    .order('specialty')

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/crm"
          className="text-slate-400 hover:text-white transition flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to CRM
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Add Lead</h1>
        <p className="text-slate-400 text-sm mt-0.5">Create a new lead and start the email sequence</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <LeadForm specialtyDefaults={specialtyDefaults ?? []} />
      </div>
    </div>
  )
}
