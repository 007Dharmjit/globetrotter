import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Plus, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'
import TripHeader from '../components/TripHeader'
import { formatDate, formatMoney } from '../format'
import { chartColors, colors } from '../theme'

const CATEGORY_LABELS = {
  transport: 'Travel',
  stay: 'Stay',
  meals: 'Meals',
  activities: 'Activities',
}

function Tile({ label, value, tone = 'default' }) {
  return (
    <div className="card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === 'danger' ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

export default function Budget() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    Promise.all([client.get(`/trips/${id}`), client.get(`/trips/${id}/budget`)])
      .then(([tripRes, budgetRes]) => {
        setTrip(tripRes.data)
        setBudget(budgetRes.data)
      })
      .catch((error) => setFailed(readError(error, 'Could not load the budget for this trip.')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader rows={3} />

  if (!trip || !budget) {
    return (
      <section>
        <PageHeader title="Budget" helper="Where the money goes, day by day." />
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
        <Link to="/trips" className="btn-secondary mt-4">
          Back to my trips
        </Link>
      </section>
    )
  }

  const pieData = Object.entries(budget.by_category)
    .map(([key, value]) => ({ name: CATEGORY_LABELS[key] || key, value: Number(value) }))
    .filter((slice) => slice.value > 0)

  const dayData = budget.by_day.map((day) => ({
    label: formatDate(day.date, { day: 'numeric', month: 'short' }),
    cost: Number(day.cost),
    over: day.over_budget,
  }))

  const overDays = budget.by_day.filter((day) => day.over_budget)

  return (
    <section>
      <TripHeader trip={trip} helper="Where the money goes, day by day, with a warning when you go over." />

      {trip.stops.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nothing to add up yet"
          message="Add a stop or two and the costs will appear here on their own."
          action={
            <Link to={`/trips/${trip.id}/build`} className="btn-primary">
              <Plus size={18} />
              Open the builder
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {budget.total_budget && (
            <div
              role="status"
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                budget.over_budget
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              {budget.over_budget ? (
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              )}
              <p>
                {budget.over_budget
                  ? `This plan is ${formatMoney(Number(budget.total) - Number(budget.total_budget))} over your ${formatMoney(budget.total_budget)} budget.`
                  : `You are within budget, with ${formatMoney(Number(budget.total_budget) - Number(budget.total))} still unspent.`}
                {overDays.length > 0 &&
                  ` ${overDays.length} ${overDays.length === 1 ? 'day goes' : 'days go'} over the ${formatMoney(budget.daily_limit)} daily limit.`}
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Planned total" value={formatMoney(budget.total)} tone={budget.over_budget ? 'danger' : 'default'} />
            <Tile label="Budget" value={budget.total_budget ? formatMoney(budget.total_budget) : 'Not set'} />
            <Tile label="Average per day" value={formatMoney(budget.avg_per_day)} />
            <Tile label="Daily limit" value={budget.daily_limit ? formatMoney(budget.daily_limit) : 'Not set'} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-medium text-slate-900">Where the money goes</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {pieData.map((slice, index) => (
                        <Cell key={slice.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="mb-4 text-lg font-medium text-slate-900">Cost per day</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData} margin={{ top: 4, right: 4, bottom: 4, left: -12 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.muted }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: colors.muted }} width={64} tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {dayData.map((day) => (
                        <Cell key={day.label} fill={day.over ? colors.danger : colors.primary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {overDays.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">Days shown in red cost more than your daily limit.</p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="px-6 pt-6 text-lg font-medium text-slate-900">Cost by stop</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">City</th>
                    <th className="px-6 py-3 font-medium">Nights</th>
                    <th className="px-6 py-3 font-medium">Travel</th>
                    <th className="px-6 py-3 font-medium">Stay</th>
                    <th className="px-6 py-3 font-medium">Meals</th>
                    <th className="px-6 py-3 font-medium">Activities</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budget.by_stop.map((row) => (
                    <tr key={row.stop_id}>
                      <td className="px-6 py-3">
                        <span className="font-medium text-slate-900">{row.city}</span>
                        <span className="block text-xs text-slate-500">{row.country}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{row.nights}</td>
                      <td className="px-6 py-3 text-slate-600">{formatMoney(row.transport)}</td>
                      <td className="px-6 py-3 text-slate-600">{formatMoney(row.stay)}</td>
                      <td className="px-6 py-3 text-slate-600">{formatMoney(row.meals)}</td>
                      <td className="px-6 py-3 text-slate-600">{formatMoney(row.activities)}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
