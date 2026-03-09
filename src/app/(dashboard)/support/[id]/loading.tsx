import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function TicketDetailLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-8 w-20" />
      <div className="space-y-2">
        <div className="flex gap-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-5 w-16" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    </div>
  )
}
