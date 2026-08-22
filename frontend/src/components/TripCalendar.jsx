import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { formatDate, formatMoney, parseDate } from '../format'
import SortableActivities, { SortableActivityRow } from './SortableActivities'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Splits the trip into the calendar months it touches, each padded to whole weeks.
function monthsOf(days) {
  const byMonth = new Map()
  days.forEach((day) => {
    const date = parseDate(day.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!byMonth.has(key)) byMonth.set(key, { year: date.getFullYear(), month: date.getMonth(), days: [] })
    byMonth.get(key).days.push(day)
  })
  return [...byMonth.values()]
}

function plannedCost(planned) {
  return Number(planned.cost_override ?? planned.activity.cost)
}

// A handover day shows activities from the city being left and the one being arrived in, so the
// day is split per stop. Dragging only ever happens inside one of those groups.
function groupsForDay(day, stops) {
  const byStop = new Map()
  day.activities.forEach((planned) => {
    if (!byStop.has(planned.stop_id)) byStop.set(planned.stop_id, [])
    byStop.get(planned.stop_id).push(planned)
  })
  return [...byStop.entries()].map(([stopId, activities]) => ({
    stop: stops.find((s) => s.id === stopId),
    activities,
  }))
}

// The endpoint sets the order of a whole stop, but a day shows only part of it. Drop the day's
// new order back into the slots it already occupied, leaving the other days where they were.
function spliceDayOrder(stop, dayIds, newDayIds) {
  const full = stop.activities.map((planned) => planned.id)
  const next = [...full]
  let cursor = 0
  full.forEach((id, slot) => {
    if (dayIds.includes(id)) {
      next[slot] = newDayIds[cursor]
      cursor += 1
    }
  })
  return next
}

export default function TripCalendar({ trip, days, onReorder, onEdit }) {
  const [openDate, setOpenDate] = useState(days.find((day) => day.activities.length > 0)?.date || days[0].date)
  const byDate = new Map(days.map((day) => [day.date, day]))
  const open = byDate.get(openDate)
  const groups = open ? groupsForDay(open, trip.stops) : []

  return (
    <div className="space-y-6">
      {monthsOf(days).map(({ year, month, days: monthDays }) => {
        const first = new Date(year, month, 1)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const lead = (first.getDay() + 6) % 7 // weeks start on Monday

        return (
          <div key={`${year}-${month}`} className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-medium text-slate-900">
              {first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
              {WEEKDAYS.map((label) => (
                <div key={label} className="pb-2">
                  {label.slice(0, 1)}
                  <span className="hidden sm:inline">{label.slice(1)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: lead }).map((_, i) => (
                <div key={`lead-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                const day = monthDays.find((d) => d.date === iso)

                if (!day) {
                  return (
                    <div key={iso} className="flex aspect-square items-center justify-center rounded-lg p-1 text-xs text-slate-300 sm:aspect-auto sm:min-h-20">
                      {dayNumber}
                    </div>
                  )
                }

                const selected = openDate === iso
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setOpenDate(iso)}
                    aria-pressed={selected}
                    aria-label={`${formatDate(iso)}${day.stop ? `, ${day.stop.city.name}` : ''}`}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-xs transition sm:aspect-auto sm:min-h-20 ${
                      selected ? 'border-primary bg-primary/10' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium text-slate-900">{dayNumber}</span>
                    {day.stop && (
                      <span className="w-full truncate px-0.5 text-[10px] leading-tight text-slate-500">
                        {day.stop.city.name}
                      </span>
                    )}
                    {day.activities.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {open && (
        <div className="card p-6">
          <h3 className="text-base font-medium text-slate-900">
            {formatDate(open.date, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-sm text-slate-500">
            {open.stop ? `${open.stop.city.name}, ${open.stop.city.country}` : 'No city planned for this day'}
          </p>

          {open.activities.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing planned — a free day.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {groups.map(({ stop, activities }) => {
                const dayIds = activities.map((planned) => planned.id)
                const rows = activities.map((planned) => (
                  <SortableActivityRow key={planned.id} id={planned.id} label={planned.activity.name}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{planned.activity.name}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {planned.activity.category}
                        {planned.notes ? ` · ${planned.notes}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      {planned.start_time && (
                        <p className="font-medium text-slate-900">{planned.start_time.slice(0, 5)}</p>
                      )}
                      <p>{plannedCost(planned) === 0 ? 'Free' : formatMoney(plannedCost(planned))}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                      onClick={() => onEdit(planned, stop)}
                      aria-label={`Edit ${planned.activity.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                  </SortableActivityRow>
                ))

                return (
                  <div key={stop.id}>
                    {groups.length > 1 && (
                      <p className="mb-1 text-xs font-medium text-slate-500">In {stop.city.name}</p>
                    )}
                    <SortableActivities
                      ids={dayIds}
                      onReorder={(order) => onReorder(stop, spliceDayOrder(stop, dayIds, order))}
                    >
                      {rows}
                    </SortableActivities>
                  </div>
                )
              })}
              <p className="text-xs text-slate-500">
                Drag a handle to reorder this day, or open one to change its time, cost or note.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
