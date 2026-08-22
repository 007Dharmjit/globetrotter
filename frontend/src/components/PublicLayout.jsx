import { Link, Outlet } from 'react-router-dom'
import { Globe2 } from 'lucide-react'

// Header for pages a signed-out visitor can reach, with no links into the app.
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="flex items-center gap-2 text-slate-900">
            <Globe2 size={22} className="text-primary" />
            <span className="text-base font-semibold tracking-tight">GlobeTrotter</span>
          </span>
          <Link to="/signup" className="btn-secondary">
            Plan your own trip
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
