import { Clock, IndianRupee } from 'lucide-react'
import { formatMoney } from '../format'

const CATEGORY_STYLE = {
  sightseeing: 'bg-sky-50 text-sky-700',
  food: 'bg-amber-50 text-amber-700',
  adventure: 'bg-emerald-50 text-emerald-700',
  culture: 'bg-violet-50 text-violet-700',
  nightlife: 'bg-indigo-50 text-indigo-700',
  shopping: 'bg-rose-50 text-rose-700',
}

export default function ActivityCard({ activity, action }) {
  return (
    <article className="card flex flex-col p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium text-slate-900">{activity.name}</h3>
        <span className={`chip capitalize ${CATEGORY_STYLE[activity.category] || ''}`}>{activity.category}</span>
      </div>

      {activity.description && <p className="mt-2 flex-1 text-sm text-slate-500">{activity.description}</p>}

      <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <IndianRupee size={16} className="text-slate-400" />
          {Number(activity.cost) === 0 ? 'Free' : formatMoney(activity.cost)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={16} className="text-slate-400" />
          {Number(activity.duration_hours)} h
        </span>
      </div>

      {action && <div className="mt-5">{action}</div>}
    </article>
  )
}
