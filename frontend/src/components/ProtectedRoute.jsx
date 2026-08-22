import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { TOKEN_KEY } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader rows={2} />
  // Still holding a token but no profile means the API is unreachable, not that the session
  // ended. Stay on the page so the banner is visible instead of bouncing to the login screen.
  if (!user && !localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
