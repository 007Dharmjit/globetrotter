import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import Navbar from './Navbar'

export default function Layout() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const flag = () => setOffline(true)
    window.addEventListener('api-offline', flag)
    return () => window.removeEventListener('api-offline', flag)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {offline && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-amber-800">
            <WifiOff size={16} />
            <span>Cannot reach the server. Start the API on port 8000, then</span>
            <button type="button" onClick={() => window.location.reload()} className="font-medium underline">
              retry
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
