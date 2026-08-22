import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import client, { readError } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import EmptyState from '../components/EmptyState'
import ExploreTabs from '../components/ExploreTabs'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'

export default function ActivitySearch() {
  const [params, setParams] = useSearchParams()
  const cityId = params.get('city') || ''

  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [maxDuration, setMaxDuration] = useState('')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState('')

  const costProblem = maxCost !== '' && Number(maxCost) < 0 ? 'Cost cannot be negative.' : ''
  const durationProblem = maxDuration !== '' && Number(maxDuration) <= 0 ? 'Hours must be more than zero.' : ''

  useEffect(() => {
    client.get('/cities?sort=name&limit=100').then(({ data }) => setCities(data)).catch(() => setCities([]))
    client.get('/activities/categories').then(({ data }) => setCategories(data)).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!cityId) {
      setActivities([])
      return undefined
    }
    // Nonsense numbers are caught here rather than bounced back by the server.
    if (costProblem || durationProblem) return undefined
    setLoading(true)
    const search = new URLSearchParams({ city_id: cityId })
    if (category) search.set('category', category)
    if (maxCost) search.set('max_cost', maxCost)
    if (maxDuration) search.set('max_duration', maxDuration)

    const timer = setTimeout(() => {
      client
        .get(`/activities?${search.toString()}`)
        .then(({ data }) => {
          setActivities(data)
          setFailed('')
        })
        .catch((error) => setFailed(readError(error, 'Could not load activities.')))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(timer)
  }, [cityId, category, maxCost, maxDuration, costProblem, durationProblem])

  function pickCity(value) {
    const next = new URLSearchParams(params)
    if (value) next.set('city', value)
    else next.delete('city')
    setParams(next, { replace: true })
  }

  return (
    <section>
      <PageHeader
        title="Explore activities"
        helper="Pick a city, then narrow by category, cost and duration before you plan the day."
      />

      <ExploreTabs />

      <div className="card mb-6 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
            City
          </label>
          <select id="city" className="input" value={cityId} onChange={(e) => pickCity(e.target.value)}>
            <option value="">Choose a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name} className="capitalize">
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="max-cost" className="mb-1 block text-sm font-medium text-slate-700">
            Max cost
          </label>
          <input
            id="max-cost"
            type="number"
            min="0"
            step="500"
            className={`input ${costProblem ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            placeholder="Any"
            aria-invalid={costProblem ? 'true' : undefined}
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
          />
          {costProblem && <p className="mt-1 text-xs text-red-600">{costProblem}</p>}
        </div>

        <div>
          <label htmlFor="max-duration" className="mb-1 block text-sm font-medium text-slate-700">
            Max hours
          </label>
          <input
            id="max-duration"
            type="number"
            min="1"
            step="1"
            className={`input ${durationProblem ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            placeholder="Any"
            aria-invalid={durationProblem ? 'true' : undefined}
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
          />
          {durationProblem && <p className="mt-1 text-xs text-red-600">{durationProblem}</p>}
        </div>
      </div>

      {failed && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {failed}
        </p>
      )}

      {!cityId ? (
        <EmptyState
          icon={Ticket}
          title="Choose a city to see what there is to do"
          message="Every city in the catalogue comes with things to see, eat and try."
        />
      ) : loading ? (
        <Loader rows={3} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nothing matches those filters"
          message="Raise the cost or hours limit, or switch back to all categories."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setCategory('')
                setMaxCost('')
                setMaxDuration('')
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </section>
  )
}
