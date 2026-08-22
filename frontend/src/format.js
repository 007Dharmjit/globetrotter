export const currency = 'INR'

export function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

// Dates travel as plain yyyy-mm-dd strings, so they are parsed as local days.
export function parseDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return parseDate(value).toLocaleDateString('en-IN', options)
}

export function formatDateRange(start, end) {
  const sameYear = parseDate(start).getFullYear() === parseDate(end).getFullYear()
  const from = formatDate(start, sameYear ? { day: 'numeric', month: 'short' } : undefined)
  return `${from} – ${formatDate(end)}`
}

export function dayCount(start, end) {
  return Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1
}

export function toInputDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
