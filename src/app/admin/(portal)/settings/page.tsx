import { Construction } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-slate-400" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Coming Soon</h1>
      <p className="text-slate-400 text-sm max-w-xs">
        This section is under active development and will be available shortly.
      </p>
    </div>
  )
}
