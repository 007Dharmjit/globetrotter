import { NavLink } from 'react-router-dom'
import { CalendarDays, Wallet } from 'lucide-react'
import { dayCount, formatDateRange, formatMoney } from '../format'

function tabClass({ isActive }) {
  return [
    'border-b-2 px-1 pb-3 text-sm font-medium transition',
    isActive ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900',
  ].join(' ')
}

export default function TripHeader({ trip, helper }) {
  const days = dayCount(trip.start_date, trip.end_date)

  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{trip.name}</h1>
      {helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={16} className="text-slate-400" />
          {formatDateRange(trip.start_date, trip.end_date)} · {days} days
        </span>
        {trip.total_budget && (
          <span className="flex items-center gap-1.5">
            <Wallet size={16} className="text-slate-400" />
            Budget {formatMoney(trip.total_budget)}
          </span>
        )}
      </div>

      <nav className="mt-5 flex gap-6 border-b border-slate-200">
        <NavLink to={`/trips/${trip.id}`} end className={tabClass}>
          Overview
        </NavLink>
        <NavLink to={`/trips/${trip.id}/build`} className={tabClass}>
          Builder
        </NavLink>
        <NavLink to={`/trips/${trip.id}/budget`} className={tabClass}>
          Budget
        </NavLink>
      </nav>
    </header>
  )
}
