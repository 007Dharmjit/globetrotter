import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import client, { readError } from '../api/client'
import FormInput from '../components/FormInput'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { toInputDate } from '../format'

const MAX_TRIP_DAYS = 60
const today = toInputDate(new Date())

const blank = { name: '', description: '', start_date: '', end_date: '', total_budget: '' }

function problems(form, isEdit) {
  const found = {}
  const name = form.name.trim()
  if (!name) found.name = 'Trip name is required.'
  else if (name.length < 3) found.name = 'Use at least 3 characters.'
  else if (name.length > 100) found.name = 'Use 100 characters or fewer.'

  if (form.description.length > 500) found.description = 'Keep the description under 500 characters.'

  if (!form.start_date) found.start_date = 'Start date is required.'
  else if (!isEdit && form.start_date < today) found.start_date = 'Start date cannot be in the past.'

  if (!form.end_date) found.end_date = 'End date is required.'
  else if (form.start_date && form.end_date < form.start_date) {
    found.end_date = 'End date must be on or after the start date.'
  } else if (form.start_date) {
    const span = (new Date(form.end_date) - new Date(form.start_date)) / 86400000
    if (span > MAX_TRIP_DAYS) found.end_date = `A trip can span at most ${MAX_TRIP_DAYS} days.`
  }

  if (form.total_budget !== '' && Number(form.total_budget) <= 0) {
    found.total_budget = 'Budget must be greater than zero.'
  }
  return found
}

export default function CreateTrip() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { notify } = useToast()

  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    client
      .get(`/trips/${id}`)
      .then(({ data }) =>
        setForm({
          name: data.name,
          description: data.description || '',
          start_date: data.start_date,
          end_date: data.end_date,
          total_budget: data.total_budget ? String(Number(data.total_budget)) : '',
        }),
      )
      .catch((error) => setFailed(readError(error, 'Could not load this trip.')))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFailed('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = problems(form, isEdit)
    setErrors(found)
    if (Object.keys(found).length) return

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      total_budget: form.total_budget === '' ? null : Number(form.total_budget),
    }

    setPending(true)
    try {
      if (isEdit) {
        await client.put(`/trips/${id}`, body)
        notify('Trip updated.')
        navigate(`/trips/${id}`)
      } else {
        const { data } = await client.post('/trips', body)
        notify('Trip created. Now add your first stop.')
        navigate(`/trips/${data.id}/build`)
      }
    } catch (error) {
      setFailed(readError(error, 'Could not save this trip. Please check the dates and try again.'))
    } finally {
      setPending(false)
    }
  }

  if (loading) return <Loader rows={2} />

  return (
    <section className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit trip' : 'Plan a new trip'}
        helper={
          isEdit
            ? 'Change the name, dates or budget of this trip.'
            : 'Name your trip and set the dates — cities come next.'
        }
      />

      <form className="card space-y-4 p-6" onSubmit={onSubmit} noValidate>
        {failed && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {failed}
          </p>
        )}

        <FormInput
          label="Trip name"
          name="name"
          placeholder="Kerala backwaters and beaches"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
        />
        <FormInput
          label="Description"
          name="description"
          as="textarea"
          rows={3}
          placeholder="What is this trip about?"
          hint="Optional, up to 500 characters."
          value={form.description}
          onChange={update('description')}
          error={errors.description}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Start date"
            name="start_date"
            type="date"
            min={isEdit ? undefined : today}
            value={form.start_date}
            onChange={update('start_date')}
            error={errors.start_date}
          />
          <FormInput
            label="End date"
            name="end_date"
            type="date"
            min={form.start_date || today}
            value={form.end_date}
            onChange={update('end_date')}
            error={errors.end_date}
          />
        </div>

        <FormInput
          label="Total budget"
          name="total_budget"
          type="number"
          min="1"
          step="500"
          placeholder="60000"
          hint="Optional. We use it to flag days that go over."
          value={form.total_budget}
          onChange={update('total_budget')}
          error={errors.total_budget}
        />

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(isEdit ? `/trips/${id}` : '/trips')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
