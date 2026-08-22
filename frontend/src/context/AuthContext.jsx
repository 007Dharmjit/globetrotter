import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import client, { TOKEN_KEY } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    client
      .get('/users/me')
      .then(({ data }) => setUser(data))
      .catch((error) => {
        // A server that cannot be reached is not a rejected session: keep the token so the
        // traveller is still signed in once the API is back, and let the banner explain.
        if (error.response) localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setUser(data.user)
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { data } = await client.post('/auth/signup', { name, email, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, setUser }),
    [user, loading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
