export default function LeadDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-24 bg-slate-800 rounded" />
      <div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-48 bg-slate-800 rounded" />
          <div className="h-5 w-16 bg-slate-800 rounded-full" />
          <div className="h-5 w-14 bg-slate-800 rounded-full" />
        </div>
        <div className="h-4 w-32 bg-slate-800 rounded mt-2" />
      </div>

      <div className="h-9 w-72 bg-slate-900 rounded-lg border border-slate-800" />

      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between py-2 border-b border-slate-800">
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-28 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
