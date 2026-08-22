import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const TOKEN_KEY = 'globetrotter_token'

const client = axios.create({ baseURL, timeout: 15000 })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // No response at all usually means the API is not running.
      window.dispatchEvent(new CustomEvent('api-offline'))
    } else if (error.response.status === 401 && !window.location.pathname.startsWith('/share/')) {
      localStorage.removeItem(TOKEN_KEY)
      if (!['/login', '/signup'].includes(window.location.pathname)) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

// Turns any axios failure into one sentence we can show next to a form or in a banner.
export function readError(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    // FastAPI prefixes messages raised by a validator with "Value error, ".
    return (detail[0].msg || fallback).replace(/^Value error, /, '')
  }
  if (!error?.response) return 'Cannot reach the server. Make sure the API is running on port 8000.'
  return fallback
}

export default client
