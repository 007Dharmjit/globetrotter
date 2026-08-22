import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, Globe2, LayoutDashboard, LogOut, Map, Menu, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/trips', label: 'My Trips', icon: Map },
  { to: '/explore/cities', label: 'Explore', icon: Compass },
]

function linkClass({ isActive }) {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function signOut() {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <Globe2 size={22} className="text-primary" />
          <span className="text-base font-semibold tracking-tight">GlobeTrotter</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/profile" className={linkClass}>
            <User size={18} />
            {user ? user.name.split(' ')[0] : 'Profile'}
          </NavLink>
          {user && (
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
              Log out
            </button>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[...links, { to: '/profile', label: user ? user.name.split(' ')[0] : 'Profile', icon: User }].map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut size={18} />
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
