import { useEffect, useState } from 'react'
import client, { readError } from '../api/client'
import FormInput from '../components/FormInput'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
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

  const [form, setForm] = useState({ name: '', language: 'en' })
  const [languages, setLanguages] = useState(['en'])
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (user) setForm({ name: user.name, language: user.language })
  }, [user])

  useEffect(() => {
    client.get('/users/languages').then(({ data }) => setLanguages(data)).catch(() => setLanguages(['en']))
  }, [])

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
