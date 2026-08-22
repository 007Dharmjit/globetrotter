export default function PageHeader({ title, helper, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}
      </div>
      {action}
    </div>
  )
}
