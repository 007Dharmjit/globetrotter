import { Clock, IndianRupee, Landmark, Mountain, Music, Palette, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { assetUrl } from '../api/client'
import { formatMoney } from '../format'

const CATEGORY_STYLE = {
  sightseeing: 'bg-sky-50 text-sky-700',
  food: 'bg-amber-50 text-amber-700',
  adventure: 'bg-emerald-50 text-emerald-700',
  culture: 'bg-violet-50 text-violet-700',
  nightlife: 'bg-indigo-50 text-indigo-700',
  shopping: 'bg-rose-50 text-rose-700',
}

// The catalogue is seeded offline and ships no photographs, so a card leads with its category
// instead. An activity that does get a picture shows it here in place of the band.
const CATEGORY_BAND = {
  sightseeing: { tone: 'bg-sky-100 text-sky-700', icon: Landmark },
  food: { tone: 'bg-amber-100 text-amber-700', icon: UtensilsCrossed },
  adventure: { tone: 'bg-emerald-100 text-emerald-700', icon: Mountain },
  culture: { tone: 'bg-violet-100 text-violet-700', icon: Palette },
  nightlife: { tone: 'bg-indigo-100 text-indigo-700', icon: Music },
  shopping: { tone: 'bg-rose-100 text-rose-700', icon: ShoppingBag },
}

function Banner({ activity }) {
  if (activity.image_url) {
    return <img src={assetUrl(activity.image_url)} alt="" className="h-28 w-full object-cover" />
  }

  const { tone, icon: Icon } = CATEGORY_BAND[activity.category] || CATEGORY_BAND.sightseeing
  return (
    <div className={`flex h-28 w-full items-center justify-center ${tone}`}>
      <Icon size={30} aria-hidden="true" />
    </div>
  )
}

export default function ActivityCard({ activity, action }) {
  return (
    <article className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Banner activity={activity} />

      <div className="flex flex-1 flex-col p-6">
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
      </div>
    </article>
  )
}
