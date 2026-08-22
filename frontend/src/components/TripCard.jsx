import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Trash2, Wallet } from 'lucide-react'
import { dayCount, formatDateRange, formatMoney } from '../format'

export default function TripCard({ trip, onDelete }) {
  const days = dayCount(trip.start_date, trip.end_date)

  return (
    <article className="card flex flex-col p-6 transition-shadow hover:shadow-md">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-slate-900">{trip.name}</h3>
        {trip.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{trip.description}</p>}

        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-slate-400" />
            <dd>
              {formatDateRange(trip.start_date, trip.end_date)} · {days} {days === 1 ? 'day' : 'days'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <dd>
              {trip.stop_count} {trip.stop_count === 1 ? 'stop' : 'stops'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-slate-400" />
            <dd>
              {formatMoney(trip.estimated_cost)} planned
              {trip.total_budget ? ` of ${formatMoney(trip.total_budget)}` : ''}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Link to={`/trips/${trip.id}`} className="btn-primary flex-1">
          View
        </Link>
        <Link to={`/trips/${trip.id}/edit`} className="btn-secondary flex-1">
          Edit
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(trip)}
            aria-label={`Delete ${trip.name}`}
            className="btn-danger px-3"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </article>
  )
}
