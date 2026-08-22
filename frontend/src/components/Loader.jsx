// Skeleton placeholder used while a list or panel is loading.
export default function Loader({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white">
          <div className="space-y-2 p-4">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
