import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { readError } from '../api/client'
import FormInput from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { emailProblem } from '../validation'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: '' })
    setFailed('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = {
      email: emailProblem(form.email),
      password: form.password ? '' : 'Password is required.',
    }
    setErrors(found)
    if (found.email || found.password) return

    setPending(true)
    try {
      await login(form.email.trim(), form.password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (error) {
      setFailed(readError(error, 'Email or password is incorrect.'))
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to pick up your trip planning.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            {failed && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {failed}
              </p>
            )}
            <FormInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
            />
            <div>
              <FormInput
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={form.password}
                onChange={update('password')}
                error={errors.password}
              />
              <Link to="/forgot" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
