import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSupportLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40 bg-slate-800" />
        <Skeleton className="h-4 w-20 bg-slate-800" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-24 bg-slate-800 rounded-lg" />)}
      </div>
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-3 border-b border-slate-800 flex gap-4">
            <Skeleton className="h-4 w-16 bg-slate-800" />
            <Skeleton className="h-4 w-32 bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-800" />
            <Skeleton className="h-4 w-24 bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
