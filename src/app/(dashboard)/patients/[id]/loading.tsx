import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-48 rounded-lg md:col-span-1" />
        <Skeleton className="h-48 rounded-lg md:col-span-2" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}
