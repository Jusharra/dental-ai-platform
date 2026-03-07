export default function CRMLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-8 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-48 bg-slate-800 rounded mt-1" />
        </div>
        <div className="h-9 w-28 bg-slate-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="h-3 w-20 bg-slate-800 rounded mb-2" />
            <div className="h-8 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      <div className="h-9 w-full bg-slate-900 rounded-lg border border-slate-800" />

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 flex gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 w-16 bg-slate-800 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-slate-800 px-4 py-4 flex gap-8 items-center">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-24 bg-slate-800 rounded" />
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-5 w-16 bg-slate-800 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
