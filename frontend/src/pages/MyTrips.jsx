import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Luggage, Plus } from 'lucide-react'
import client, { readError } from '../api/client'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import TripCard from '../components/TripCard'

export default function MyTrips() {
  const { notify } = useToast()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    client
      .get('/trips')
      .then(({ data }) => setTrips(data))
      .catch((error) => setFailed(readError(error, 'Could not load your trips.')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await client.delete(`/trips/${confirming.id}`)
      notify(`"${confirming.name}" deleted.`)
      setConfirming(null)
      load()
    } catch (error) {
      notify(readError(error, 'Could not delete this trip.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <PageHeader
        title="My Trips"
        helper="Every trip you have planned, with its stops and estimated cost."
        action={
          <Link to="/trips/new" className="btn-primary">
            <Plus size={18} />
            Plan new trip
          </Link>
        }
      />

      {failed && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
      )}

      {loading ? (
        <Loader rows={3} />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="No trips yet"
          message="Start with a name and a set of dates — you can add cities right after."
          action={
            <Link to="/trips/new" className="btn-primary">
              <Plus size={18} />
              Plan your first trip
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={setConfirming} />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(confirming)}
        title="Delete this trip?"
        helper={confirming ? `"${confirming.name}" and everything planned inside it will be removed.` : ''}
        onClose={() => setConfirming(null)}
      >
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setConfirming(null)}>
            Keep it
          </button>
          <button type="button" className="btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete trip'}
          </button>
        </div>
      </Modal>
    </section>
  )
}
