import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Link2Off, MapPin } from 'lucide-react'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import ItineraryDays, { buildDays } from '../components/ItineraryDays'
import Loader from '../components/Loader'
import ShareButtons from '../components/ShareButtons'
import { dayCount, formatDateRange } from '../format'

export default function SharedTrip() {
  const { token } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    client
      .get(`/share/${token}`)
      .then(({ data }) => setTrip(data))
      .catch((error) => setFailed(readError(error, 'This link is not valid.')))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Loader rows={3} />

  if (!trip) {
    return (
      <EmptyState
        icon={Link2Off}
        title="This link does not lead to a trip"
        message={failed}
        action={
          <Link to="/signup" className="btn-primary">
            Plan a trip of your own
          </Link>
        }
      />
    )
  }

  const days = dayCount(trip.start_date, trip.end_date)

  return (
    <section>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Shared itinerary</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{trip.name}</h1>
        {trip.description && <p className="mt-1 text-sm text-slate-500">{trip.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} className="text-slate-400" />
            {formatDateRange(trip.start_date, trip.end_date)} · {days} days
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} className="text-slate-400" />
            {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>

        <div className="mt-4">
          <ShareButtons tripName={trip.name} url={window.location.href} />
        </div>
      </header>

      {trip.stops.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing planned yet" message="This trip has no stops so far." />
      ) : (
        <ItineraryDays days={buildDays(trip)} />
      )}
    </section>
  )
}
