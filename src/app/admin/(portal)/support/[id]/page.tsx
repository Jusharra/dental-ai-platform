import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketAdminActions } from '@/components/admin/support/ticket-admin-actions'
import { AdminReplyForm } from '@/components/admin/support/admin-reply-form'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved:    'bg-green-500/10 text-green-400 border-green-500/20',
  closed:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

const CATEGORY_LABEL: Record<string, string> = {
  technical_issue: 'Technical Issue', billing: 'Billing',
  feature_request: 'Feature Request', training: 'Training',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at, resolved_at, practices(id, name)')
    .eq('id', params.id)
    .single()

  if (!ticket) notFound()

  const { data: messages } = await supabase
    .from('support_ticket_messages')
    .select('id, sender_id, sender_role, body, is_internal, created_at, users(full_name)')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  const practice = ticket.practices as unknown as { id: string; name: string } | null

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/support">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Support
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm text-slate-500">{ticket.ticket_number}</span>
          <Badge variant="outline" className={STATUS_BADGE[ticket.status]}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </Badge>
          <Badge variant="outline" className={cn('text-xs capitalize', PRIORITY_BADGE[ticket.priority])}>
            {ticket.priority}
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
            {CATEGORY_LABEL[ticket.category] ?? ticket.category}
          </Badge>
        </div>

        <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          {practice && (
            <span>
              Practice:{' '}
              <Link href={`/admin/practices/${practice.id}`} className="text-orange-400 hover:underline">
                {practice.name}
              </Link>
            </span>
          )}
          <span>Opened {new Date(ticket.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
        </div>
      </div>

      {/* Admin actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Manage Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketAdminActions
            ticketId={ticket.id}
            currentStatus={ticket.status}
            currentPriority={ticket.priority}
          />
        </CardContent>
      </Card>

      {/* Message thread */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!messages?.length && (
            <p className="text-sm text-slate-500 text-center py-4">No messages yet.</p>
          )}
          {messages?.map(msg => {
            const isAdmin    = msg.sender_role === 'super_admin'
            const isInternal = msg.is_internal
            const sender     = (msg.users as unknown as { full_name: string } | null)?.full_name ?? (isAdmin ? 'Admin' : 'Practice')
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-4 py-3 text-sm space-y-1.5',
                  isInternal
                    ? 'bg-yellow-950/30 border border-yellow-700/30'
                    : isAdmin
                      ? 'bg-orange-950/30 border border-orange-700/30 ml-8'
                      : 'bg-slate-800 border border-slate-700 mr-8'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-xs text-slate-300">
                    {isInternal && <Lock className="h-3 w-3 text-yellow-500" />}
                    {sender}
                    {isInternal && <span className="text-yellow-600 text-[10px]">internal</span>}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Admin reply */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Reply</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminReplyForm ticketId={ticket.id} />
        </CardContent>
      </Card>
    </div>
  )
}
