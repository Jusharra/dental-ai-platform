import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'


const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved:    'bg-green-500/10 text-green-400 border-green-500/20',
  closed:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

const CATEGORY_LABEL: Record<string, string> = {
  technical_issue: 'Technical Issue', billing: 'Billing',
  feature_request: 'Feature Request', training: 'Training',
}

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const
const CATEGORY_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'billing',         label: 'Billing' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'training',        label: 'Training' },
]

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; q?: string }
}) {
  const status   = searchParams.status   || ''
  const category = searchParams.category || ''
  const q        = searchParams.q        || ''

  const supabase = createServiceClient()

  let query = supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at, practices(id, name)')
    .order('updated_at', { ascending: false })

  if (status && status !== 'all')   query = query.eq('status', status)
  if (category)                     query = query.eq('category', category)

  const { data: tickets } = await query

  let rows = tickets ?? []
  if (q) {
    const lower = q.toLowerCase()
    rows = rows.filter(r =>
      r.ticket_number.toLowerCase().includes(lower) ||
      r.subject.toLowerCase().includes(lower) ||
      (r.practices as unknown as { name: string } | null)?.name.toLowerCase().includes(lower)
    )
  }

  function filterHref(patch: Record<string, string>) {
    const p: Record<string, string> = { ...(status ? { status } : {}), ...(category ? { category } : {}), ...(q ? { q } : {}), ...patch }
    const qs = new URLSearchParams(p).toString()
    return `/admin/support${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-slate-400 text-sm mt-0.5">{rows.length} ticket{rows.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map(s => (
          <Link key={s} href={filterHref({ status: s === 'all' ? '' : s })}>
            <span className={cn(
              'px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors capitalize',
              (status === s || (s === 'all' && !status))
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                : 'text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
            )}>
              {s === 'all' ? 'All' : STATUS_LABEL[s] ?? s}
            </span>
          </Link>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <select
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5"
            value={category}
            onChange={e => window.location.href = filterHref({ category: e.target.value })}
          >
            {CATEGORY_FILTERS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <form method="get" action="/admin/support">
            {status   && <input type="hidden" name="status"   value={status} />}
            {category && <input type="hidden" name="category" value={category} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Search tickets…"
              className="bg-slate-800 border border-slate-700 text-slate-300 placeholder-slate-500 text-sm rounded-lg px-3 py-1.5 w-52"
            />
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Ticket #</TableHead>
              <TableHead className="text-slate-400">Practice</TableHead>
              <TableHead className="text-slate-400">Subject</TableHead>
              <TableHead className="text-slate-400">Category</TableHead>
              <TableHead className="text-slate-400">Priority</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : rows.map(ticket => {
              const practice = ticket.practices as unknown as { id: string; name: string } | null
              return (
                <TableRow key={ticket.id} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/support/${ticket.id}`} className="font-mono text-sm text-orange-400 hover:underline">
                      {ticket.ticket_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {practice ? (
                      <Link href={`/admin/practices/${practice.id}`} className="text-slate-300 hover:text-white text-sm hover:underline">
                        {practice.name}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/support/${ticket.id}`} className="text-slate-200 hover:text-white text-sm hover:underline">
                      {ticket.subject}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs capitalize', PRIORITY_BADGE[ticket.priority])}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', STATUS_BADGE[ticket.status])}>
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
