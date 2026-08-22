import { ArrowDown, ArrowUp, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { dayCount, formatDate, formatMoney } from '../format'

function plannedCost(planned) {
  return Number(planned.cost_override ?? planned.activity.cost)
}

export default function StopCard({ stop, position, total, onMove, onEdit, onDelete, onAddActivity, onRemoveActivity }) {
  const nights = dayCount(stop.arrival_date, stop.departure_date) - 1

  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {position + 1}
          </span>
          <div>
            <h3 className="text-lg font-medium text-slate-900">{stop.city.name}</h3>
            <p className="text-sm text-slate-500">{stop.city.country}</p>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(stop.arrival_date)} → {formatDate(stop.departure_date)} ·{' '}
              {nights === 0 ? 'day trip' : `${nights} ${nights === 1 ? 'night' : 'nights'}`}
            </p>
            {Number(stop.transport_cost) > 0 && (
              <p className="text-sm text-slate-500">Getting here {formatMoney(stop.transport_cost)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary px-2"
            onClick={() => onMove(stop, -1)}
            disabled={position === 0}
            aria-label={`Move ${stop.city.name} up`}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary px-2"
            onClick={() => onMove(stop, 1)}
            disabled={position === total - 1}
            aria-label={`Move ${stop.city.name} down`}
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary px-2"
            onClick={() => onEdit(stop)}
            aria-label={`Edit ${stop.city.name}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="btn-danger px-2"
            onClick={() => onDelete(stop)}
            aria-label={`Remove ${stop.city.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {stop.activities.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing planned here yet.</p>
        ) : (
          <ul className="space-y-2">
            {stop.activities.map((planned) => (
              <li
                key={planned.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{planned.activity.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(planned.scheduled_date, { day: 'numeric', month: 'short' })}
                    {planned.start_time ? ` · ${planned.start_time.slice(0, 5)}` : ''}
                    {' · '}
                    {plannedCost(planned) === 0 ? 'Free' : formatMoney(plannedCost(planned))}
                    {' · '}
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {Number(planned.activity.duration_hours)} h
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => onRemoveActivity(planned)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="btn-secondary mt-4" onClick={() => onAddActivity(stop)}>
          <Plus size={16} />
          Add activity
        </button>
      </div>
    </article>
  )
}
