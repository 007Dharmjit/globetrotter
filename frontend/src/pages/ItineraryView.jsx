import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarRange, Check, Copy, List, MapPin, Plus, Share2 } from 'lucide-react'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import ItineraryDays, { buildDays } from '../components/ItineraryDays'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ShareButtons from '../components/ShareButtons'
import { useToast } from '../components/Toast'
import TripCalendar from '../components/TripCalendar'
import TripHeader from '../components/TripHeader'


export default function ItineraryView() {
  const { id } = useParams()
  const { notify } = useToast()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [mode, setMode] = useState('list')
  const [share, setShare] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function openShare() {
    setSharing(true)
    try {
      const { data } = await client.post(`/trips/${id}/share`)
      setShare(data)
      setCopied(false)
    } catch (error) {
      notify(readError(error, 'Could not create a link for this trip.'), 'error')
    } finally {
      setSharing(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(share.share_url)
      setCopied(true)
    } catch {
      // Some browsers refuse clipboard access; the link is on screen to copy by hand.
      notify('Select the link above and copy it.', 'error')
    }
  }

  async function stopSharing() {
    try {
      await client.delete(`/trips/${id}/share`)
      setShare(null)
      notify('This trip is private again.')
    } catch (error) {
      notify(readError(error, 'Could not stop sharing this trip.'), 'error')
    }
  }

  useEffect(() => {
    client
      .get(`/trips/${id}`)
      .then(({ data }) => setTrip(data))
      .catch((error) => setFailed(readError(error, 'Could not load this trip.')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader rows={3} />

  if (!trip) {
    return (
      <section>
        <PageHeader title="Itinerary" helper="Your plan day by day, grouped by city." />
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
        <Link to="/trips" className="btn-secondary mt-4">
          Back to my trips
        </Link>
      </section>
    )
  }

  const days = buildDays(trip)

  return (
    <section>
      <TripHeader trip={trip} helper="Your plan day by day, grouped by city." />

      {trip.stops.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="This trip has no stops yet"
          message="Add the cities you are visiting and the days will fill in here."
          action={
            <Link to={`/trips/${trip.id}/build`} className="btn-primary">
              <Plus size={18} />
              Open the builder
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={mode === 'list' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setMode('list')}
              aria-pressed={mode === 'list'}
            >
              <List size={16} />
              List
            </button>
            <button
              type="button"
              className={mode === 'calendar' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setMode('calendar')}
              aria-pressed={mode === 'calendar'}
            >
              <CalendarRange size={16} />
              Calendar
            </button>

            <button type="button" className="btn-secondary sm:ml-auto" onClick={openShare} disabled={sharing}>
              <Share2 size={16} />
              {sharing ? 'Creating link…' : 'Share'}
            </button>
          </div>

          {mode === 'list' ? <ItineraryDays days={days} /> : <TripCalendar trip={trip} days={days} />}

          <Modal
            open={Boolean(share)}
            title="Anyone with this link can view the trip"
            helper="They see the plan only — nothing can be changed and no account is needed."
            onClose={() => setShare(null)}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <input readOnly aria-label="Share link" className="input" value={share?.share_url || ''} />
                <button type="button" className="btn-primary shrink-0" onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <ShareButtons tripName={trip.name} url={share?.share_url} />
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-danger" onClick={stopSharing}>
                  Stop sharing
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShare(null)}>
                  Done
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </section>
  )
}
