import { useEffect, useState } from 'react'
import FormInput from './FormInput'
import Modal from './Modal'

// Quick edits to something already planned: the day it sits on, its time, what it costs and a note.
export default function PlannedActivityModal({ open, planned, stop, onClose, onSave, onRemove }) {
  const [form, setForm] = useState({ day: '', startTime: '', cost: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !planned) return
    setForm({
      day: planned.scheduled_date,
      startTime: planned.start_time ? planned.start_time.slice(0, 5) : '',
      cost: planned.cost_override === null ? '' : String(Number(planned.cost_override)),
      notes: planned.notes || '',
    })
    setErrors({})
    setFailed('')
  }, [open, planned])

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFailed('')
  }

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!form.day) found.day = 'Pick a day.'
    else if (form.day < stop.arrival_date || form.day > stop.departure_date) {
      found.day = 'Pick a day you are in this city.'
    }
    if (form.cost !== '' && Number(form.cost) < 0) found.cost = 'Cost cannot be negative.'
    if (form.notes.length > 200) found.notes = 'Keep the note under 200 characters.'
    setErrors(found)
    if (Object.keys(found).length) return

    setPending(true)
    try {
      await onSave({
        activity_id: planned.activity_id,
        scheduled_date: form.day,
        start_time: form.startTime || null,
        cost_override: form.cost === '' ? null : Number(form.cost),
        notes: form.notes.trim() || null,
      })
    } catch (error) {
      setFailed(error.message)
    } finally {
      setPending(false)
    }
  }

  if (!planned || !stop) return null

  return (
    <Modal open={open} title={planned.activity.name} helper={`In ${stop.city.name} — change the day, time or cost.`} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        {failed && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {failed}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Day"
            name="scheduled_date"
            type="date"
            min={stop.arrival_date}
            max={stop.departure_date}
            value={form.day}
            onChange={update('day')}
            error={errors.day}
          />
          <FormInput
            label="Start time"
            name="start_time"
            type="time"
            hint="Optional."
            value={form.startTime}
            onChange={update('startTime')}
          />
        </div>

        <FormInput
          label="Cost"
          name="cost_override"
          type="number"
          min="0"
          step="100"
          placeholder={String(Number(planned.activity.cost))}
          hint="Leave empty to use the catalogue price."
          value={form.cost}
          onChange={update('cost')}
          error={errors.cost}
        />

        <FormInput
          label="Note"
          name="notes"
          placeholder="Booking reference, who you are meeting…"
          hint="Optional, up to 200 characters."
          value={form.notes}
          onChange={update('notes')}
          error={errors.notes}
        />

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" className="btn-danger sm:mr-auto" onClick={() => onRemove(planned)}>
            Remove from trip
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
