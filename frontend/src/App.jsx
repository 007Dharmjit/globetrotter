import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ActivitySearch from './pages/ActivitySearch'
import Budget from './pages/Budget'
import CitySearch from './pages/CitySearch'
import CreateTrip from './pages/CreateTrip'
import Dashboard from './pages/Dashboard'
import ItineraryBuilder from './pages/ItineraryBuilder'
import ItineraryView from './pages/ItineraryView'
import Login from './pages/Login'
import MyTrips from './pages/MyTrips'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import SharedTrip from './pages/SharedTrip'
import Signup from './pages/Signup'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trips/new" element={<CreateTrip />} />
          <Route path="/trips/:id" element={<ItineraryView />} />
          <Route path="/trips/:id/build" element={<ItineraryBuilder />} />
          <Route path="/trips/:id/budget" element={<Budget />} />
          <Route path="/explore/cities" element={<CitySearch />} />
          <Route path="/explore/activities" element={<ActivitySearch />} />
          <Route path="/share/:token" element={<SharedTrip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
