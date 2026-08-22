import { useEffect, useState } from 'react'
import client, { readError } from '../api/client'
import FormInput from './FormInput'
import Loader from './Loader'
import Modal from './Modal'
import { formatMoney } from '../format'

export default function ActivityPickerModal({ open, stop, onClose, onAdd }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState(null)
  const [day, setDay] = useState('')
  const [startTime, setStartTime] = useState('')
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !stop) return
    setChosen(null)
    setDay(stop.arrival_date)
    setStartTime('')
    setErrors({})
    setFailed('')
    setLoading(true)
    client
      .get(`/activities?city_id=${stop.city_id}`)
      .then(({ data }) => setActivities(data))
      .catch((error) => setFailed(readError(error, 'Could not load activities for this city.')))
      .finally(() => setLoading(false))
  }, [open, stop])

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!chosen) found.activity = 'Pick an activity.'
    if (!day) found.day = 'Pick a day.'
    else if (day < stop.arrival_date || day > stop.departure_date) {
      found.day = 'Pick a day you are in this city.'
    }
    setErrors(found)
    if (Object.keys(found).length) return

    setPending(true)
    try {
      await onAdd({
        activity_id: chosen.id,
        scheduled_date: day,
        start_time: startTime || null,
      })
    } catch (error) {
      setFailed(error.message)
    } finally {
      setPending(false)
    }
  }

  if (!stop) return null

  return (
    <Modal
      open={open}
      title={`Add an activity in ${stop.city.name}`}
      helper="Pick something to do, then say which day it goes on."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {failed && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {failed}
          </p>
        )}

        {loading ? (
          <Loader rows={2} />
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {activities.map((activity) => (
              <button
                type="button"
                key={activity.id}
                onClick={() => {
                  setChosen(activity)
                  setErrors((current) => ({ ...current, activity: '' }))
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  chosen?.id === activity.id
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900">{activity.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {Number(activity.cost) === 0 ? 'Free' : formatMoney(activity.cost)} ·{' '}
                    {Number(activity.duration_hours)} h
                  </span>
                </span>
                <span className="mt-0.5 block text-xs capitalize text-slate-500">{activity.category}</span>
              </button>
            ))}
          </div>
        )}
        {errors.activity && <p className="text-xs text-red-600">{errors.activity}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Day"
            name="scheduled_date"
            type="date"
            min={stop.arrival_date}
            max={stop.departure_date}
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

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Adding…' : 'Add to stop'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
