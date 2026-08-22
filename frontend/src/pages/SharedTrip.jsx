import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Copy, Link2Off, MapPin } from 'lucide-react'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import ItineraryDays, { buildDays } from '../components/ItineraryDays'
import Loader from '../components/Loader'
import ShareButtons from '../components/ShareButtons'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { dayCount, formatDateRange } from '../format'

export default function SharedTrip() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notify } = useToast()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    client
      .get(`/share/${token}`)
      .then(({ data }) => setTrip(data))
      .catch((error) => setFailed(readError(error, 'This link is not valid.')))
      .finally(() => setLoading(false))
  }, [token])

  // A visitor with no account is sent to log in and comes straight back here afterwards.
  async function copyTrip() {
    if (!user) {
      navigate('/login', { state: { from: `/share/${token}` } })
      return
    }

    setCopying(true)
    try {
      const { data } = await client.post(`/share/${token}/copy`)
      notify('Copied to your trips. The dates now start tomorrow.')
      navigate(`/trips/${data.id}/build`)
    } catch (error) {
      notify(readError(error, 'Could not copy this trip.'), 'error')
    } finally {
      setCopying(false)
    }
  }

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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={copyTrip} disabled={copying}>
            <Copy size={18} />
            {copying ? 'Copying…' : 'Copy trip'}
          </button>
          <ShareButtons tripName={trip.name} url={window.location.href} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Copying makes it yours to edit, starting tomorrow. Nothing here changes.
        </p>
      </header>

      {trip.stops.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing planned yet" message="This trip has no stops so far." />
      ) : (
        <ItineraryDays days={buildDays(trip)} />
      )}
    </section>
  )
}
