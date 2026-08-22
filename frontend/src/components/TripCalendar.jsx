import { useState } from 'react'
import { formatDate, formatMoney, parseDate } from '../format'

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

export default function TripCalendar({ days }) {
  const [openDate, setOpenDate] = useState(days.find((day) => day.activities.length > 0)?.date || days[0].date)
  const byDate = new Map(days.map((day) => [day.date, day]))
  const open = byDate.get(openDate)

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
            <ul className="mt-3 space-y-2">
              {open.activities.map((planned) => (
                <li key={planned.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{planned.activity.name}</p>
                    <p className="text-xs capitalize text-slate-500">{planned.activity.category}</p>
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
      )}
    </div>
  )
}
