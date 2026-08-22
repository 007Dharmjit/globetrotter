import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Compass, Plus, Wallet } from 'lucide-react'
import client, { readError } from '../api/client'
import CityCard from '../components/CityCard'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import TripCard from '../components/TripCard'
import { useAuth } from '../context/AuthContext'
import { formatMoney, toInputDate } from '../format'

export default function Dashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [cities, setCities] = useState([])
  const [highlight, setHighlight] = useState(null)
  const [failed, setFailed] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .get('/trips')
      .then(({ data }) => {
        setTrips(data)
        // The nearest trip that has a budget gets a running total on the dashboard.
        const today = toInputDate(new Date())
        const next = data.find((trip) => trip.end_date >= today && trip.total_budget)
        if (!next) return null
        return client
          .get(`/trips/${next.id}/budget`)
          .then(({ data: budget }) => setHighlight({ trip: next, budget }))
          .catch(() => setHighlight(null))
      })
      .catch((error) => setFailed(readError(error, 'Could not load your trips.')))
      .finally(() => setLoading(false))

    client
      .get('/cities/popular')
      .then(({ data }) => setCities(data))
      .catch(() => setCities([]))
  }, [])

  const today = toInputDate(new Date())
  const upcoming = trips.filter((trip) => trip.end_date >= today).slice(0, 3)

  return (
    <section className="space-y-8">
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary-light p-6 text-white sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome back'}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-teal-50">
          Pick up a trip where you left off, or start a new one — stops, activities and the budget all live together.
        </p>
        <Link
          to="/trips/new"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-primary transition hover:bg-teal-50 active:scale-[0.98]"
        >
          <Plus size={18} />
          Plan new trip
        </Link>
      </div>

      {highlight && (
        <Link
          to={`/trips/${highlight.trip.id}/budget`}
          className="card block p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Wallet size={14} />
                Budget so far
              </p>
              <p className="mt-1 text-lg font-medium text-slate-900">{highlight.trip.name}</p>
            </div>
            <p className={`text-lg font-semibold ${highlight.budget.over_budget ? 'text-red-600' : 'text-slate-900'}`}>
              {formatMoney(highlight.budget.total)}
              <span className="text-sm font-normal text-slate-500"> of {formatMoney(highlight.budget.total_budget)}</span>
            </p>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${highlight.budget.over_budget ? 'bg-red-500' : 'bg-primary'}`}
              style={{
                width: `${Math.min(
                  100,
                  (Number(highlight.budget.total) / Number(highlight.budget.total_budget)) * 100,
                )}%`,
              }}
            />
          </div>

          {highlight.budget.over_budget && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-red-700">
              <AlertTriangle size={16} />
              This plan is over budget — open it to see which days cost the most.
            </p>
          )}
        </Link>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Upcoming trips</h2>
          {trips.length > 0 && (
            <Link to="/trips" className="text-sm font-medium text-primary hover:underline">
              See all trips
            </Link>
          )}
        </div>

        {failed ? (
          <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-900">Your trips could not be loaded</p>
            <p className="text-sm text-slate-500">{failed}</p>
            <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <Loader rows={2} />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Nothing planned yet"
            message="Create a trip and it will show up here with its dates and running cost."
            action={
              <Link to="/trips/new" className="btn-primary">
                <Plus size={18} />
                Plan your first trip
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {cities.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Popular right now</h2>
            <Link to="/explore/cities" className="text-sm font-medium text-primary hover:underline">
              Explore all cities
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                action={
                  <Link to={`/explore/activities?city=${city.id}`} className="btn-secondary w-full">
                    See activities
                  </Link>
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
