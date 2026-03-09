import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminTicketDetailLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-8 w-20 bg-slate-800" />
      <div className="space-y-2">
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-5 w-20 bg-slate-800" />)}
        </div>
        <Skeleton className="h-7 w-72 bg-slate-800" />
        <Skeleton className="h-4 w-48 bg-slate-800" />
      </div>
      {[0, 1, 2].map(i => (
        <Card key={i} className="bg-slate-900 border-slate-800">
          <CardHeader><Skeleton className="h-4 w-28 bg-slate-800" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
