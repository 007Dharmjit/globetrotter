import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Plus } from 'lucide-react'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import { useToast } from '../components/Toast'
import TripCard from '../components/TripCard'
import { useAuth } from '../context/AuthContext'
import { toInputDate } from '../format'

export default function Dashboard() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .get('/trips')
      .then(({ data }) => setTrips(data))
      .catch((error) => notify(readError(error, 'Could not load your trips.'), 'error'))
      .finally(() => setLoading(false))
  }, [notify])

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

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Upcoming trips</h2>
          {trips.length > 0 && (
            <Link to="/trips" className="text-sm font-medium text-primary hover:underline">
              See all trips
            </Link>
          )}
        </div>

        {loading ? (
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
    </section>
  )
}
