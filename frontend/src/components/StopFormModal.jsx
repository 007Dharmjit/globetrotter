import { useEffect, useState } from 'react'
import FormInput from './FormInput'
import Modal from './Modal'

const blank = { city_id: '', arrival_date: '', departure_date: '', transport_cost: '', stay_cost_override: '' }

export default function StopFormModal({ open, trip, cities, stop, presetCityId, onClose, onSave }) {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFailed('')
    setForm(
      stop
        ? {
            city_id: String(stop.city_id),
            arrival_date: stop.arrival_date,
            departure_date: stop.departure_date,
            transport_cost: Number(stop.transport_cost) ? String(Number(stop.transport_cost)) : '',
            stay_cost_override: stop.stay_cost_override ? String(Number(stop.stay_cost_override)) : '',
          }
        : { ...blank, city_id: presetCityId ? String(presetCityId) : '' },
    )
  }, [open, stop, presetCityId])

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFailed('')
  }

  function check() {
    const found = {}
    if (!form.city_id) found.city_id = 'Pick a city.'

    if (!form.arrival_date) found.arrival_date = 'Arrival date is required.'
    else if (form.arrival_date < trip.start_date || form.arrival_date > trip.end_date) {
      found.arrival_date = 'Arrival must fall inside the trip dates.'
    }

    if (!form.departure_date) found.departure_date = 'Departure date is required.'
    else if (form.arrival_date && form.departure_date < form.arrival_date) {
      found.departure_date = 'Departure must be on or after arrival.'
    } else if (form.departure_date > trip.end_date) {
      found.departure_date = 'Departure must fall inside the trip dates.'
    }

    if (form.transport_cost !== '' && Number(form.transport_cost) < 0) {
      found.transport_cost = 'Transport cost cannot be negative.'
    }
    if (form.stay_cost_override !== '' && Number(form.stay_cost_override) < 0) {
      found.stay_cost_override = 'Stay cost cannot be negative.'
    }
    return found
  }

  async function submit(e) {
    e.preventDefault()
    const found = check()
    setErrors(found)
    if (Object.keys(found).length) return

    setPending(true)
    try {
      await onSave({
        city_id: Number(form.city_id),
        arrival_date: form.arrival_date,
        departure_date: form.departure_date,
        transport_cost: form.transport_cost === '' ? 0 : Number(form.transport_cost),
        stay_cost_override: form.stay_cost_override === '' ? null : Number(form.stay_cost_override),
      })
    } catch (error) {
      setFailed(error.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      title={stop ? `Edit stop in ${stop.city.name}` : 'Add a stop'}
      helper={`Pick a city and the days you are there, between ${trip.start_date} and ${trip.end_date}.`}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {failed && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {failed}
          </p>
        )}

        <div>
          <label htmlFor="city_id" className="mb-1 block text-sm font-medium text-slate-700">
            City
          </label>
          <select
            id="city_id"
            name="city_id"
            className="input"
            value={form.city_id}
            onChange={update('city_id')}
            disabled={Boolean(stop)}
          >
            <option value="">Choose a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
          {errors.city_id && <p className="mt-1 text-xs text-red-600">{errors.city_id}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Arrival"
            name="arrival_date"
            type="date"
            min={trip.start_date}
            max={trip.end_date}
            value={form.arrival_date}
            onChange={update('arrival_date')}
            error={errors.arrival_date}
          />
          <FormInput
            label="Departure"
            name="departure_date"
            type="date"
            min={form.arrival_date || trip.start_date}
            max={trip.end_date}
            value={form.departure_date}
            onChange={update('departure_date')}
            error={errors.departure_date}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Travel cost to get here"
            name="transport_cost"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            value={form.transport_cost}
            onChange={update('transport_cost')}
            error={errors.transport_cost}
          />
          <FormInput
            label="Stay cost"
            name="stay_cost_override"
            type="number"
            min="0"
            step="500"
            placeholder="City average"
            hint="Leave blank to use the city average."
            value={form.stay_cost_override}
            onChange={update('stay_cost_override')}
            error={errors.stay_cost_override}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Saving…' : stop ? 'Save stop' : 'Add stop'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
