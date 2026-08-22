import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import Loader from './Loader'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const { notify } = useToast()
  const told = useRef(false)

  const blocked = !loading && user && !user.is_admin

  useEffect(() => {
    if (blocked && !told.current) {
      told.current = true
      notify('That area is for administrators only.', 'error')
    }
  }, [blocked, notify])

  if (loading) return <Loader rows={2} />
  if (blocked) return <Navigate to="/" replace />
  return <Outlet />
}
