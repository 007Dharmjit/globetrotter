import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { readError } from '../api/client'
import FormInput from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { emailProblem, nameProblem, passwordProblem } from '../validation'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      name: nameProblem(form.name),
      email: emailProblem(form.email),
      password: passwordProblem(form.password),
    }
    setErrors(found)
    if (found.name || found.email || found.password) return

    setPending(true)
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      navigate('/', { replace: true })
    } catch (error) {
      const message = readError(error, 'Could not create your account. Please try again.')
      if (error?.response?.status === 409) {
        setErrors((current) => ({ ...current, email: message }))
      } else {
        setFailed(message)
      }
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start planning multi-city trips in under a minute.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            {failed && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {failed}
              </p>
            )}
            <FormInput
              label="Name"
              name="name"
              autoComplete="name"
              placeholder="Riya Shah"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
            />
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
            <FormInput
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint="At least 8 characters, with a letter and a number."
              value={form.password}
              onChange={update('password')}
              error={errors.password}
            />
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
