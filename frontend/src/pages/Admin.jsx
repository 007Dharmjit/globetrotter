import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'
import { BarChart3 } from 'lucide-react'
import { formatDate } from '../format'
import { colors } from '../theme'

function Tile({ label, value }) {
  return (
    <div className="card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    client
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((error) => setFailed(readError(error, 'Could not load the numbers.')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader rows={3} />

  if (!stats) {
    return <EmptyState icon={BarChart3} title="Nothing to show" message={failed} />
  }

  const perDay = stats.trips_per_day.map((row) => ({
    label: formatDate(row.date, { day: 'numeric', month: 'short' }),
    trips: row.trips,
  }))
  const cityData = stats.top_cities.map((row) => ({ label: row.city, stops: row.stops }))

  return (
    <section>
      <PageHeader title="Analytics" helper="How the app is being used, across every traveller." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Travellers" value={stats.totals.users} />
        <Tile label="Trips" value={stats.totals.trips} />
        <Tile label="City stops" value={stats.totals.stops} />
        <Tile label="Planned activities" value={stats.totals.planned_activities} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Trips created</h2>
          <p className="mt-1 text-xs text-slate-500">Last 14 days</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perDay} margin={{ top: 4, right: 4, bottom: 4, left: -8 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.muted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: colors.muted }} allowDecimals={false} width={52} />
                <Tooltip />
                <Bar dataKey="trips" fill={colors.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Most visited cities</h2>
          <p className="mt-1 text-xs text-slate-500">By number of stops</p>
          <div className="mt-4 h-64">
            {cityData.length === 0 ? (
              <p className="text-sm text-slate-500">No stops planned yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: colors.muted }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.muted }}
                    width={78}
                  />
                  <Tooltip />
                  <Bar dataKey="stops" fill={colors.primaryLight} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Most planned activities</h2>
        {stats.top_activities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No activities planned yet.</p>
        ) : (
          <ol className="mt-4 divide-y divide-slate-100">
            {stats.top_activities.map((row, index) => (
              <li key={`${row.city}-${row.activity}`} className="flex items-center gap-4 py-3">
                <span className="w-5 text-sm font-medium text-slate-400">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-900">{row.activity}</span>
                  <span className="block text-xs text-slate-500">{row.city}</span>
                </span>
                <span className="chip">{row.times_planned} planned</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Newest travellers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Trips</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_users.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-3 text-slate-900">{row.name}</td>
                  <td className="px-6 py-3 text-slate-600">{row.email}</td>
                  <td className="px-6 py-3 text-slate-600">{formatDate(row.joined)}</td>
                  <td className="px-6 py-3 text-slate-900">{row.trips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
