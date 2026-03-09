import { notFound, redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketReplyForm } from '@/components/support/ticket-reply-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'


const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved:    'bg-green-100 text-green-700 border-green-200',
  closed:      'bg-slate-100 text-slate-600 border-slate-200',
}

const STATUS_LABEL: Record<string, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
}

const CATEGORY_LABEL: Record<string, string> = {
  technical_issue:  'Technical Issue',
  billing:          'Billing',
  feature_request:  'Feature Request',
  training:         'Training',
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const profile = await getUserProfile()
  if (!profile?.practice_id) redirect('/login')

  const supabase = createClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at')
    .eq('id', params.id)
    .eq('practice_id', profile.practice_id)
    .single()

  if (!ticket) notFound()

  const { data: messages } = await supabase
    .from('support_ticket_messages')
    .select('id, sender_id, sender_role, body, created_at, users(full_name)')
    .eq('ticket_id', params.id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/support">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Support
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
          <Badge variant="outline" className={STATUS_BADGE[ticket.status]}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABEL[ticket.category] ?? ticket.category}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground">
          Opened {new Date(ticket.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Message thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages?.map(msg => {
            const isAdmin = msg.sender_role === 'super_admin'
            const sender  = (msg.users as unknown as { full_name: string } | null)?.full_name ?? 'Support'
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col gap-1 rounded-lg px-4 py-3 text-sm',
                  isAdmin
                    ? 'bg-orange-50 border border-orange-200 ml-8'
                    : 'bg-slate-50 border border-slate-200 mr-8'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-xs">
                    {isAdmin ? 'Support Team' : sender}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            )
          })}

          {!messages?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Reply form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reply</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketReplyForm ticketId={params.id} isResolved={isResolved} />
        </CardContent>
      </Card>
    </div>
  )
}
