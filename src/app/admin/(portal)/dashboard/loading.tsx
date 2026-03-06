export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-52 bg-slate-800 rounded mb-2" />
        <div className="h-4 w-40 bg-slate-800 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl h-56" />
        <div className="bg-slate-900 border border-slate-800 rounded-xl h-56" />
      </div>
    </div>
  )
}