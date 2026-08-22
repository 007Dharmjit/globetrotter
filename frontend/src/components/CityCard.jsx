import { formatMoney } from '../format'

// Each region gets its own band colour so the catalogue reads as a set without any images.
const REGION_TINT = {
  Asia: 'from-amber-400 to-orange-500',
  Europe: 'from-sky-400 to-indigo-500',
  Americas: 'from-rose-400 to-pink-500',
  Africa: 'from-lime-400 to-emerald-500',
  Oceania: 'from-cyan-400 to-teal-500',
}

function CostDots({ level }) {
  return (
    <span className="flex items-center gap-1" title={`Cost level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <span
          key={dot}
          className={`h-1.5 w-1.5 rounded-full ${dot <= level ? 'bg-primary' : 'bg-slate-200'}`}
        />
      ))}
    </span>
  )
}

export default function CityCard({ city, action }) {
  return (
    <article className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className={`h-24 bg-gradient-to-br ${REGION_TINT[city.region] || 'from-slate-300 to-slate-400'}`} />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-slate-900">{city.name}</h3>
            <p className="text-sm text-slate-500">{city.country}</p>
          </div>
          <span className="chip">{city.region}</span>
        </div>

        <dl className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Stay per day</dt>
            <dd className="font-medium text-slate-900">{formatMoney(city.avg_stay_cost_per_day)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Meals per day</dt>
            <dd className="font-medium text-slate-900">{formatMoney(city.avg_meal_cost_per_day)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Cost level</dt>
            <dd>
              <CostDots level={city.cost_index} />
            </dd>
          </div>
        </dl>

        {action && <div className="mt-5">{action}</div>}
      </div>
    </article>
  )
}
