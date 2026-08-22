import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MapPin, Plus } from 'lucide-react'
import client, { readError } from '../api/client'
import ActivityPickerModal from '../components/ActivityPickerModal'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import StopCard from '../components/StopCard'
import StopFormModal from '../components/StopFormModal'
import { useToast } from '../components/Toast'
import TripHeader from '../components/TripHeader'

export default function ItineraryBuilder() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { notify } = useToast()

  const [trip, setTrip] = useState(null)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')

  const presetCityId = params.get('city')
  const [stopForm, setStopForm] = useState(null)
  const [activityFor, setActivityFor] = useState(null)
  const [removingStop, setRemovingStop] = useState(null)

  const load = useCallback(
    () =>
      client
        .get(`/trips/${id}`)
        .then(({ data }) => {
          setTrip(data)
          setFailed('')
          return data
        })
        .catch((error) => setFailed(readError(error, 'Could not load this trip.')))
        .finally(() => setLoading(false)),
    [id],
  )

  useEffect(() => {
    load()
    client.get('/cities?sort=name&limit=100').then(({ data }) => setCities(data)).catch(() => setCities([]))
  }, [load])

  // Arriving from Explore with ?city= opens the add-stop form on that city.
  useEffect(() => {
    if (presetCityId) setStopForm({ stop: null })
  }, [presetCityId])

  function closeStopForm() {
    setStopForm(null)
    if (presetCityId) {
      const next = new URLSearchParams(params)
      next.delete('city')
      setParams(next, { replace: true })
    }
  }

  async function saveStop(body) {
    try {
      if (stopForm.stop) {
        await client.put(`/stops/${stopForm.stop.id}`, body)
        notify('Stop updated.')
      } else {
        await client.post(`/trips/${id}/stops`, body)
        notify('Stop added.')
      }
      closeStopForm()
      await load()
    } catch (error) {
      throw new Error(readError(error, 'Could not save this stop.'))
    }
  }

  async function move(stop, direction) {
    const order = trip.stops.map((s) => s.id)
    const from = order.indexOf(stop.id)
    const to = from + direction
    if (to < 0 || to >= order.length) return
    ;[order[from], order[to]] = [order[to], order[from]]

    try {
      await client.put(`/trips/${id}/stops/reorder`, { stop_ids: order })
      await load()
    } catch (error) {
      notify(readError(error, 'Could not reorder the stops.'), 'error')
    }
  }

  async function removeStop() {
    try {
      await client.delete(`/stops/${removingStop.id}`)
      notify(`${removingStop.city.name} removed.`)
      setRemovingStop(null)
      await load()
    } catch (error) {
      notify(readError(error, 'Could not remove this stop.'), 'error')
    }
  }

  async function addActivity(body) {
    try {
      await client.post(`/stops/${activityFor.id}/activities`, body)
      notify('Activity added.')
      setActivityFor(null)
      await load()
    } catch (error) {
      throw new Error(readError(error, 'Could not add this activity.'))
    }
  }

  async function removeActivity(planned) {
    try {
      await client.delete(`/stop-activities/${planned.id}`)
      notify('Activity removed.')
      await load()
    } catch (error) {
      notify(readError(error, 'Could not remove this activity.'), 'error')
    }
  }

  if (loading) return <Loader rows={3} />

  if (!trip) {
    return (
      <section>
        <PageHeader title="Itinerary Builder" helper="Add cities and dates to build your trip stop by stop." />
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
        <Link to="/trips" className="btn-secondary mt-4">
          Back to my trips
        </Link>
      </section>
    )
  }

  return (
    <section>
      <TripHeader trip={trip} helper="Add cities and dates to build your trip stop by stop." />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">
          {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
        </h2>
        {trip.stops.length > 0 && (
          <button type="button" className="btn-primary" onClick={() => setStopForm({ stop: null })}>
            <Plus size={18} />
            Add stop
          </button>
        )}
      </div>

      {trip.stops.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No stops yet"
          message="Add the first city you are flying into, then work your way down the trip."
          action={
            <button type="button" className="btn-primary" onClick={() => setStopForm({ stop: null })}>
              <Plus size={18} />
              Add a stop
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {trip.stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              position={index}
              total={trip.stops.length}
              onMove={move}
              onEdit={(target) => setStopForm({ stop: target })}
              onDelete={setRemovingStop}
              onAddActivity={setActivityFor}
              onRemoveActivity={removeActivity}
            />
          ))}
        </div>
      )}

      {stopForm && (
        <StopFormModal
          open
          trip={trip}
          cities={cities}
          stop={stopForm.stop}
          presetCityId={stopForm.stop ? null : presetCityId}
          onClose={closeStopForm}
          onSave={saveStop}
        />
      )}

      <ActivityPickerModal
        open={Boolean(activityFor)}
        stop={activityFor}
        onClose={() => setActivityFor(null)}
        onAdd={addActivity}
      />

      <Modal
        open={Boolean(removingStop)}
        title="Remove this stop?"
        helper={removingStop ? `${removingStop.city.name} and everything planned there will go.` : ''}
        onClose={() => setRemovingStop(null)}
      >
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setRemovingStop(null)}>
            Keep it
          </button>
          <button type="button" className="btn-danger" onClick={removeStop}>
            Remove stop
          </button>
        </div>
      </Modal>
    </section>
  )
}
