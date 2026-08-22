import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe2, MailQuestion } from 'lucide-react'
import client, { readError } from '../api/client'
import FormInput from '../components/FormInput'
import { emailProblem } from '../validation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [failed, setFailed] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    const problem = emailProblem(email)
    setError(problem)
    if (problem) return

    setPending(true)
    try {
      const { data } = await client.post('/auth/forgot', { email: email.trim() })
      setSent(data)
    } catch (err) {
      setFailed(readError(err, 'Could not start a password reset. Please try again.'))
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
          {sent ? (
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailQuestion size={22} />
              </span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Check your reset link</h1>
              <p className="mt-1 text-sm text-slate-500">{sent.message}</p>

              {sent.reset_link ? (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-700">Your reset link</p>
                  <p className="mt-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {sent.reset_link}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    GlobeTrotter runs on your own machine with no mail service, so the link is shown here. In
                    production it would arrive by email instead.
                  </p>
                  <a href={sent.reset_link} className="btn-primary mt-4 w-full">
                    Open the reset page
                  </a>
                  <p className="mt-2 text-center text-xs text-slate-500">The link works once, for 15 minutes.</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Nothing else to do here — if the address is registered, its link is waiting.
                </p>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500">
                Give us the email you signed up with and we will make you a reset link.
              </p>

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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                    setFailed('')
                  }}
                  error={error}
                />
                <button type="submit" className="btn-primary w-full" disabled={pending}>
                  {pending ? 'Creating link…' : 'Create reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  )
}
