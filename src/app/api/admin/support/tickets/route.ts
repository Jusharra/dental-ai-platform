import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'

// GET /api/admin/support/tickets — all tickets with filters
export async function GET(request: NextRequest) {
  const profile = await getUserProfile()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status   = searchParams.get('status')
  const category = searchParams.get('category')
  const q        = searchParams.get('q')

  const supabase = createServiceClient()

  let query = supabase
    .from('support_tickets')
    .select('id, ticket_number, category, subject, status, priority, created_at, updated_at, practices(id, name)')
    .order('updated_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Client-side filter by practice name or ticket number
  let rows = data ?? []
  if (q) {
    const lower = q.toLowerCase()
    rows = rows.filter(r =>
      r.ticket_number.toLowerCase().includes(lower) ||
      (r.practices as unknown as { name: string } | null)?.name.toLowerCase().includes(lower)
    )
  }

  return NextResponse.json(rows)
}
