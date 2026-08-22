import { formatDate, formatMoney, parseDate, toInputDate } from '../format'

// Every date of the trip, tagged with the stop that covers it.
export function buildDays(trip) {
  const days = []
  const cursor = parseDate(trip.start_date)
  const last = parseDate(trip.end_date)

  while (cursor <= last) {
    const date = toInputDate(cursor)
    // On a handover day two stops cover the same date. The day belongs to the city you are
    // arriving in, but it still lists what was planned in either city so nothing goes missing.
    const covering = trip.stops.filter((s) => s.arrival_date <= date && date <= s.departure_date)
    const arriving = covering.find((s) => s.arrival_date === date)
    days.push({
      date,
      stop: arriving || covering[0],
      activities: covering.flatMap((s) => s.activities.filter((a) => a.scheduled_date === date)),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

// Consecutive days in the same city belong to one section.
function groupByCity(days) {
  return days.reduce((groups, day) => {
    const last = groups[groups.length - 1]
    if (last && last.stop?.id === day.stop?.id) {
      last.days.push(day)
    } else {
      groups.push({ stop: day.stop, days: [day] })
    }
    return groups
  }, [])
}

export function plannedCost(planned) {
  return Number(planned.cost_override ?? planned.activity.cost)
}

function DayRow({ day, index }) {
  return (
    <div className="border-t border-slate-100 px-6 py-4 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <p className="text-sm font-medium text-slate-900">Day {index}</p>
        <p className="text-xs text-slate-500">
          {formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
      </div>

      {day.activities.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing planned — a free day.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {day.activities.map((planned) => (
            <li
              key={planned.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{planned.activity.name}</p>
                <p className="text-xs capitalize text-slate-500">
                  {planned.activity.category} · {Number(planned.activity.duration_hours)} h
                  {planned.notes ? ` · ${planned.notes}` : ''}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                {planned.start_time && <p className="font-medium text-slate-900">{planned.start_time.slice(0, 5)}</p>}
                <p>{plannedCost(planned) === 0 ? 'Free' : formatMoney(plannedCost(planned))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ItineraryDays({ days }) {
  let dayNumber = 0

  return (
    <div className="space-y-6">
      {groupByCity(days).map((group, index) => (
        <article key={index} className="card overflow-hidden">
          <header className="flex flex-wrap items-baseline justify-between gap-2 bg-slate-50 px-6 py-4">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                {group.stop ? group.stop.city.name : 'No city planned'}
              </h2>
              <p className="text-sm text-slate-500">
                {group.stop ? group.stop.city.country : 'These days are still free'}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              {formatDate(group.days[0].date, { day: 'numeric', month: 'short' })}
              {group.days.length > 1 &&
                ` – ${formatDate(group.days[group.days.length - 1].date, { day: 'numeric', month: 'short' })}`}
              {' · '}
              {group.days.length} {group.days.length === 1 ? 'day' : 'days'}
            </p>
          </header>

          <div>
            {group.days.map((day) => {
              dayNumber += 1
              return <DayRow key={day.date} day={day} index={dayNumber} />
            })}
          </div>
        </article>
      ))}
    </div>
  )
}
