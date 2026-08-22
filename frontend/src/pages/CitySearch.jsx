import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPinned, Plus, Search } from 'lucide-react'
import client, { readError } from '../api/client'
import CityCard from '../components/CityCard'
import EmptyState from '../components/EmptyState'
import ExploreTabs from '../components/ExploreTabs'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDateRange } from '../format'

export default function CitySearch() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [term, setTerm] = useState('')
  const [region, setRegion] = useState('')
  const [sort, setSort] = useState('popularity')
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [adding, setAdding] = useState(null)
  const [trips, setTrips] = useState([])
  const [savedIds, setSavedIds] = useState([])

  useEffect(() => {
    client.get('/cities/regions').then(({ data }) => setRegions(data)).catch(() => setRegions([]))
    client.get('/trips').then(({ data }) => setTrips(data)).catch(() => setTrips([]))
    client
      .get('/users/me/saved-cities')
      .then(({ data }) => setSavedIds(data.map((city) => city.id)))
      .catch(() => setSavedIds([]))
  }, [])

  async function toggleSaved(city) {
    const wasSaved = savedIds.includes(city.id)
    // Flip straight away so the heart answers the tap, and put it back if the server disagrees.
    setSavedIds((ids) => (wasSaved ? ids.filter((id) => id !== city.id) : [...ids, city.id]))
    try {
      if (wasSaved) {
        await client.delete(`/users/me/saved-cities/${city.id}`)
        notify(`${city.name} removed from saved destinations.`)
      } else {
        await client.post('/users/me/saved-cities', { city_id: city.id })
        notify(`${city.name} saved.`)
      }
    } catch (error) {
      setSavedIds((ids) => (wasSaved ? [...ids, city.id] : ids.filter((id) => id !== city.id)))
      notify(readError(error, 'Could not update your saved destinations.'), 'error')
    }
  }

  const query = useMemo(() => {
    const params = new URLSearchParams({ sort })
    if (term.trim()) params.set('q', term.trim())
    if (region) params.set('region', region)
    return params.toString()
  }, [term, region, sort])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      client
        .get(`/cities?${query}`)
        .then(({ data }) => {
          setCities(data)
          setFailed('')
        })
        .catch((error) => setFailed(readError(error, 'Could not load cities.')))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const hint = term.length > 0 && !term.trim() ? 'Type at least one character to search.' : ''

  return (
    <section>
      <PageHeader
        title="Explore cities"
        helper="Search the catalogue and add a city straight to one of your trips."
      />

      <ExploreTabs />

      <div className="card mb-6 grid gap-4 p-6 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="city-search" className="mb-1 block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              id="city-search"
              className="input pl-9"
              placeholder="City or country"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          {hint && <p className="mt-1 text-xs text-red-600">{hint}</p>}
        </div>

        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-slate-700">
            Region
          </label>
          <select id="region" className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-sm font-medium text-slate-700">
            Sort by
          </label>
          <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popularity">Most popular</option>
            <option value="name">Name</option>
            <option value="cost">Cheapest first</option>
          </select>
        </div>
      </div>

      {failed && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
      )}

      {loading ? (
        <Loader rows={3} />
      ) : cities.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No cities match that search"
          message="Try a shorter search term or clear the region filter."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setTerm('')
                setRegion('')
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              saved={savedIds.includes(city.id)}
              onToggleSave={toggleSaved}
              action={
                <button type="button" className="btn-secondary w-full" onClick={() => setAdding(city)}>
                  <Plus size={16} />
                  Add to trip
                </button>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(adding)}
        title={adding ? `Add ${adding.name} to which trip?` : ''}
        helper="You will land in the builder with the dates ready to set."
        onClose={() => setAdding(null)}
      >
        {trips.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">You have no trips yet. Create one and this city can go straight in.</p>
            <Link to="/trips/new" className="btn-primary">
              Plan a trip
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:border-primary hover:bg-slate-50"
                  onClick={() => navigate(`/trips/${trip.id}/build?city=${adding.id}`)}
                >
                  <span className="block text-sm font-medium text-slate-900">{trip.name}</span>
                  <span className="block text-xs text-slate-500">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </section>
  )
}
