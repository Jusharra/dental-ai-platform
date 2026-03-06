'use client'

export function PracticeFilterSelect({
  practices,
  value,
}: {
  practices: { id: string; name: string }[]
  value: string
}) {
  return (
    <select
      defaultValue={value}
      onChange={e => {
        const params = new URLSearchParams(window.location.search)
        if (e.target.value) params.set('practice', e.target.value)
        else params.delete('practice')
        window.location.search = params.toString()
      }}
      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none ml-auto"
    >
      <option value="">All Practices</option>
      {practices.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )
}