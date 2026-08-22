import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client, { readError } from '../api/client'
import FormInput from './FormInput'
import Loader from './Loader'
import Modal from './Modal'
import { formatDateRange } from '../format'

// Explore knows the city but not the day, and an activity can only go on a day you are actually
// in that city. So we look through the traveller's trips for stops in this city and offer those.
export default function AddToStopModal({ open, activity, onClose, onAdded }) {
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState(null)
  const [day, setDay] = useState('')
  const [startTime, setStartTime] = useState('')
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !activity) return
    setChosen(null)
    setDay('')
    setStartTime('')
    setErrors({})
    setFailed('')
    setLoading(true)

    client
      .get('/trips')
      .then(({ data }) => Promise.all(data.map((trip) => client.get(`/trips/${trip.id}`))))
      .then((responses) => {
        const matches = responses.flatMap(({ data: trip }) =>
          trip.stops
            .filter((stop) => stop.city_id === activity.city_id)
            .map((stop) => ({ ...stop, trip })),
        )
        setStops(matches)
        if (matches.length === 1) {
          setChosen(matches[0])
          setDay(matches[0].arrival_date)
        }
      })
      .catch((error) => setFailed(readError(error, 'Could not load your trips.')))
      .finally(() => setLoading(false))
  }, [open, activity])

  function pickStop(stop) {
    setChosen(stop)
    setDay(stop.arrival_date)
    setErrors({})
  }

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!chosen) found.stop = 'Pick which stop it goes in.'
    else if (!day) found.day = 'Pick a day.'
    else if (day < chosen.arrival_date || day > chosen.departure_date) {
      found.day = 'Pick a day you are in this city.'
    }
    setErrors(found)
    if (Object.keys(found).length) return

    setPending(true)
    try {
      const { data } = await client.post(`/stops/${chosen.id}/activities`, {
        activity_id: activity.id,
        scheduled_date: day,
        start_time: startTime || null,
      })
      onAdded({ planned: data, stop: chosen })
    } catch (error) {
      setFailed(readError(error, 'Could not add this activity.'))
    } finally {
      setPending(false)
    }
  }

  if (!activity) return null

  return (
    <Modal
      open={open}
      title={`Add ${activity.name}`}
      helper="Choose the stop it belongs to, then the day."
      onClose={onClose}
    >
      {loading ? (
        <Loader rows={2} />
      ) : stops.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            None of your trips stop in this city yet. Add the city to a trip first and its activities can go
            straight in.
          </p>
          <Link to="/explore/cities" className="btn-primary" onClick={onClose}>
            Find the city
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          {failed && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {failed}
            </p>
          )}

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {stops.map((stop) => (
              <button
                type="button"
                key={stop.id}
                onClick={() => pickStop(stop)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  chosen?.id === stop.id
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block text-sm font-medium text-slate-900">{stop.trip.name}</span>
                <span className="block text-xs text-slate-500">
                  {stop.city.name} · {formatDateRange(stop.arrival_date, stop.departure_date)}
                </span>
              </button>
            ))}
          </div>
          {errors.stop && <p className="text-xs text-red-600">{errors.stop}</p>}

          {chosen && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Day"
                name="scheduled_date"
                type="date"
                min={chosen.arrival_date}
                max={chosen.departure_date}
                value={day}
                onChange={(e) => {
                  setDay(e.target.value)
                  setErrors((current) => ({ ...current, day: '' }))
                }}
                error={errors.day}
              />
              <FormInput
                label="Start time"
                name="start_time"
                type="time"
                hint="Optional."
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Adding…' : 'Add to trip'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
