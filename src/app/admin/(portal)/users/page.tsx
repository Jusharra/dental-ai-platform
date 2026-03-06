import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserActionsCell } from '@/components/admin/user-actions-cell'
import { PracticeFilterSelect } from '@/components/admin/practice-filter-select'
import { Users } from 'lucide-react'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string; practice?: string }
}) {
  const service = createServiceClient()

  let query = service
    .from('users')
    .select('id, full_name, email, role, is_active, last_login_at, created_at, practice_id, practices(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (searchParams.role)     query = query.eq('role', searchParams.role)
  if (searchParams.practice) query = query.eq('practice_id', searchParams.practice)

  const { data: users } = await query
  let rows = users ?? []

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    rows = rows.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }

  const { data: practices } = await service
    .from('practices')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  const filterBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition'
  const active   = `${filterBase} bg-orange-500/10 border-orange-500/30 text-orange-400`
  const inactive = `${filterBase} bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600`

  const roles = ['practice_owner', 'manager', 'staff', 'super_admin']

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {rows.length} user{rows.length !== 1 ? 's' : ''} ·{' '}
          {rows.filter(u => u.is_active).length} active
        </p>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search name or email…"
          className="bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 w-56"
        />
        <Link href="/admin/users" className={!searchParams.role ? active : inactive}>All Roles</Link>
        {roles.map(r => (
          <Link key={r}
            href={`/admin/users?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), role: r })}`}
            className={searchParams.role === r ? active : inactive}>
            {r.replace('_', ' ')}
          </Link>
        ))}
        <PracticeFilterSelect
          practices={practices ?? []}
          value={searchParams.practice ?? ''}
        />
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              {['User', 'Practice', 'Role', 'Status', 'Last Login', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(u => {
              const practiceName = (u.practices as unknown as { name: string } | null)?.name ?? '—'
              return (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.practice_id ? (
                      <Link href={`/admin/practices/${u.practice_id}`}
                        className="text-xs text-orange-400 hover:text-orange-300 transition">
                        {practiceName}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <UserActionsCell userId={u.id} isActive={u.is_active} currentRole={u.role} />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-12 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}