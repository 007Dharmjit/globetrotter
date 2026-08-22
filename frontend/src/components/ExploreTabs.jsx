import { NavLink } from 'react-router-dom'
import { MapPinned, Ticket } from 'lucide-react'

function tabClass({ isActive }) {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900',
  ].join(' ')
}

export default function ExploreTabs() {
  return (
    <div className="mb-6 inline-flex gap-1 rounded-lg bg-slate-100 p-1">
      <NavLink to="/explore/cities" className={tabClass}>
        <MapPinned size={16} />
        Cities
      </NavLink>
      <NavLink to="/explore/activities" className={tabClass}>
        <Ticket size={16} />
        Activities
      </NavLink>
    </div>
  )
}
