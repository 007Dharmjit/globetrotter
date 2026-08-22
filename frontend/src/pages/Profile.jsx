import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Plus, Trash2 } from 'lucide-react'
import client, { readError } from '../api/client'
import Avatar from '../components/Avatar'
import CoverField, { pictureProblem } from '../components/CoverField'
import FormInput from '../components/FormInput'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { formatDateRange } from '../format'
import { nameProblem } from '../validation'

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  gu: 'ગુજરાતી (Gujarati)',
  fr: 'Français (French)',
  es: 'Español (Spanish)',
}

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', language: 'en' })
  const [languages, setLanguages] = useState(['en'])
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saved, setSaved] = useState([])
  const [trips, setTrips] = useState([])
  const [adding, setAdding] = useState(null)
  const [pictureError, setPictureError] = useState('')

  useEffect(() => {
    if (user) setForm({ name: user.name, language: user.language })
  }, [user])

  useEffect(() => {
    client.get('/users/languages').then(({ data }) => setLanguages(data)).catch(() => setLanguages(['en']))
    client.get('/users/me/saved-cities').then(({ data }) => setSaved(data)).catch(() => setSaved([]))
    client.get('/trips').then(({ data }) => setTrips(data)).catch(() => setTrips([]))
  }, [])

  async function removeSaved(city) {
    try {
      await client.delete(`/users/me/saved-cities/${city.id}`)
      setSaved((list) => list.filter((item) => item.id !== city.id))
      notify(`${city.name} removed from saved destinations.`)
    } catch (error) {
      notify(readError(error, 'Could not remove that destination.'), 'error')
    }
  }

  // The picture is its own thing: it goes up as soon as it is picked, not on Save.
  async function pickPhoto(file) {
    const problem = pictureProblem(file)
    setPictureError(problem)
    if (problem) return

    const body = new FormData()
    body.append('file', file)
    try {
      const { data } = await client.post('/users/me/avatar', body)
      setUser(data)
      notify('Profile photo updated.')
    } catch (error) {
      setPictureError(readError(error, 'Could not save that photo.'))
    }
  }

  async function dropPhoto() {
    setPictureError('')
    try {
      const { data } = await client.delete('/users/me/avatar')
      setUser(data)
      notify('Profile photo removed.')
    } catch (error) {
      setPictureError(readError(error, 'Could not remove that photo.'))
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = { name: nameProblem(form.name) }
    setErrors(found)
    if (found.name) return

    setPending(true)
    try {
      const { data } = await client.put('/users/me', { name: form.name.trim(), language: form.language })
      setUser(data)
      notify('Profile updated.')
    } catch (error) {
      setFailed(readError(error, 'Could not save your profile.'))
    } finally {
      setPending(false)
    }
  }

  async function deleteAccount() {
    try {
      await client.delete('/users/me')
      logout()
      // A full reload, so nothing of the deleted account is left in memory. A router
      // navigation would lose to the guard's own redirect and land on the login page.
      window.location.replace('/signup')
    } catch (error) {
      notify(readError(error, 'Could not delete your account.'), 'error')
    }
  }

  return (
    <section className="max-w-2xl">
      <PageHeader title="Profile" helper="Change how your name appears and the language the app speaks to you in." />

      <form className="card space-y-4 p-6" onSubmit={onSubmit} noValidate>
        {failed && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {failed}
          </p>
        )}

        <CoverField
          label="Profile photo"
          hint="Optional. JPG or PNG, up to 2 MB."
          saved={user?.avatar}
          file={null}
          error={pictureError}
          onPick={pickPhoto}
          onRemove={dropPhoto}
          round
          fallback={<Avatar user={user} size="h-20 w-20" text="text-xl" />}
        />

        <FormInput
          label="Name"
          name="name"
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value })
            setErrors({})
            setFailed('')
          }}
          error={errors.name}
        />

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input id="email" className="input bg-slate-50 text-slate-500" value={user?.email || ''} readOnly />
          <p className="mt-1 text-xs text-slate-500">Your email is how you log in and cannot be changed here.</p>
        </div>

        <div>
          <label htmlFor="language" className="mb-1 block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="language"
            className="input"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            {languages.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code] || code}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-medium text-slate-900">Saved destinations</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cities you hearted while exploring. Drop one into a trip when you are ready.
        </p>

        {saved.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            <Heart size={18} className="text-slate-400" />
            <span>
              Nothing saved yet — tap the heart on a city in{' '}
              <Link to="/explore/cities" className="font-medium text-primary hover:underline">
                Explore
              </Link>
              .
            </span>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {saved.map((city) => (
              <li key={city.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{city.name}</span>
                  <span className="block text-xs text-slate-500">
                    {city.country} · {city.region}
                  </span>
                </span>
                <button type="button" className="btn-secondary" onClick={() => setAdding(city)}>
                  <Plus size={16} />
                  Add to trip
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  aria-label={`Remove ${city.name} from saved destinations`}
                  onClick={() => removeSaved(city)}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(adding)}
        title={adding ? `Add ${adding.name} to which trip?` : ''}
        helper="You will land in the builder with the dates ready to set."
        onClose={() => setAdding(null)}
      >
        {trips.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">You have no trips yet. Create one and this city can go straight in.</p>
            <Link to="/trips/new" className="btn-primary">
              Plan a trip
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:border-primary hover:bg-slate-50"
                  onClick={() => navigate(`/trips/${trip.id}/build?city=${adding.id}`)}
                >
                  <span className="block text-sm font-medium text-slate-900">{trip.name}</span>
                  <span className="block text-xs text-slate-500">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-medium text-slate-900">Delete account</h2>
        <p className="mt-1 text-sm text-slate-500">
          This removes your account and every trip, stop and activity you have planned. It cannot be undone.
        </p>
        <button type="button" className="btn-danger mt-4" onClick={() => setConfirming(true)}>
          Delete my account
        </button>
      </div>

      <Modal
        open={confirming}
        title="Delete your account?"
        helper="Everything you have planned goes with it. There is no way back."
        onClose={() => setConfirming(false)}
      >
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
            Keep my account
          </button>
          <button type="button" className="btn-danger" onClick={deleteAccount}>
            Delete everything
          </button>
        </div>
      </Modal>
    </section>
  )
}
