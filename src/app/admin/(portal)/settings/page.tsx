import { createServiceClient } from '@/lib/supabase/server'
import { AdminSettingsForm } from '@/components/admin/admin-settings-form'
import { Settings } from 'lucide-react'

export default async function AdminSettingsPage() {
  const service = createServiceClient()
  const { data: settings } = await service.from('admin_settings').select('*').single()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-slate-400 text-sm">Global configuration for PracticeGuard AI</p>
        </div>
      </div>

      {settings ? (
        <AdminSettingsForm initial={settings} />
      ) : (
        <p className="text-slate-400 text-sm">
          No settings record found. Run the admin migration to create it.
        </p>
      )}
    </div>
  )
}