import { createServiceClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/admin/crm/template-editor'

export default async function CRMTemplatesPage({
  searchParams,
}: {
  searchParams: { track?: string }
}) {
  const service = createServiceClient()
  const activeTrack = searchParams.track === 'track_2' ? 'Track 2' : 'Track 1'

  const { data: templates } = await service
    .from('crm_email_templates')
    .select('*')
    .eq('track', activeTrack)
    .order('email_number')
    .order('is_cold')

  const filterBtnBase = 'px-4 py-2 rounded-lg text-sm font-medium border transition'
  const activeStyle   = `${filterBtnBase} bg-orange-500/10 border-orange-500/30 text-orange-400`
  const inactiveStyle = `${filterBtnBase} bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600`

  const totalTemplates = templates?.length ?? 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Templates</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {totalTemplates} templates for {activeTrack} · Click any email to expand and edit
        </p>
      </div>

      {/* Track tabs */}
      <div className="flex gap-2">
        <a href="/admin/crm/templates?track=track_1"
          className={activeTrack === 'Track 1' ? activeStyle : inactiveStyle}>
          Track 1 — Revenue Recovery
        </a>
        <a href="/admin/crm/templates?track=track_2"
          className={activeTrack === 'Track 2' ? activeStyle : inactiveStyle}>
          Track 2 — Governance
        </a>
      </div>

      {/* Sequence schedule info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Send Schedule</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {[
            { n: 1, label: 'Immediately' },
            { n: 2, label: '+2 days' },
            { n: 3, label: '+3 days' },
            { n: 4, label: '+2 days' },
            { n: 5, label: '+3 days' },
            { n: 6, label: '+4 days' },
            { n: 7, label: '+3 days' },
            { n: 8, label: '+4 days' },
            { n: 9, label: '+7 days' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg">
              <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">{n}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-2">
        {(templates ?? []).map(t => (
          <TemplateEditor key={t.id} template={t} />
        ))}
        {!templates?.length && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No templates found. Run the migration to seed placeholder templates.
          </div>
        )}
      </div>
    </div>
  )
}
