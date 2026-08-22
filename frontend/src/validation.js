const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function emailProblem(value) {
  if (!value.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.'
  return ''
}

export function passwordProblem(value) {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.'
  return ''
}

export function nameProblem(value) {
  const name = value.trim()
  if (!name) return 'Name is required.'
  if (name.length < 2) return 'Name must be at least 2 characters.'
  if (name.length > 80) return 'Name must be 80 characters or fewer.'
  return ''
}
