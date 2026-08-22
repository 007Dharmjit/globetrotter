import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import client, { readError } from '../api/client'
import FormInput from '../components/FormInput'
import { useToast } from '../components/Toast'
import { passwordProblem } from '../validation'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFailed('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = {
      password: passwordProblem(form.password),
      confirm: form.confirm === form.password ? '' : 'Both passwords must match.',
    }
    setErrors(found)
    if (found.password || found.confirm) return

    setPending(true)
    try {
      await client.post('/auth/reset', { token, password: form.password })
      notify('Password changed. Log in with your new one.')
      navigate('/login', { replace: true })
    } catch (error) {
      setFailed(readError(error, 'Could not change your password. Ask for a new reset link.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-6 flex items-center justify-center gap-2 text-slate-900">
          <Globe2 size={24} className="text-primary" />
          <span className="text-lg font-semibold tracking-tight">GlobeTrotter</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
          <p className="mt-1 text-sm text-slate-500">Pick something you have not used here before.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            {failed && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p>{failed}</p>
                <Link to="/forgot" className="mt-1 inline-block font-medium underline">
                  Ask for a new link
                </Link>
              </div>
            )}
            <FormInput
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint="At least 8 characters, with a letter and a number."
              value={form.password}
              onChange={update('password')}
              error={errors.password}
            />
            <FormInput
              label="Confirm password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Type it once more"
              value={form.confirm}
              onChange={update('confirm')}
              error={errors.confirm}
            />
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  )
}
