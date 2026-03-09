import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'

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

export default async function SupportPage() {
  const profile = await getUserProfile()
  if (!profile?.practice_id) return null

  const supabase = createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, updated_at')
    .eq('practice_id', profile.practice_id)
    .order('updated_at', { ascending: false })

  const openCount = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">Submit and track support requests</p>
        </div>
        <Link href="/support/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Tickets</p>
            <p className="text-3xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Tickets</p>
            <p className="text-3xl font-bold">{tickets?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-3xl font-bold">
              {tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {!tickets || tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No support tickets yet</p>
              <p className="text-sm text-muted-foreground mb-4">Submit your first request and we&apos;ll get back to you quickly.</p>
              <Link href="/support/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(ticket => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/support/${ticket.id}`} className="font-mono text-sm font-medium hover:underline">
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/support/${ticket.id}`} className="hover:underline">
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[ticket.status]}>
                        {STATUS_LABEL[ticket.status] ?? ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
