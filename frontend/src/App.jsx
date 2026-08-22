import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import ActivitySearch from './pages/ActivitySearch'
import Admin from './pages/Admin'
import Budget from './pages/Budget'
import CitySearch from './pages/CitySearch'
import CreateTrip from './pages/CreateTrip'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ItineraryBuilder from './pages/ItineraryBuilder'
import ItineraryView from './pages/ItineraryView'
import Login from './pages/Login'
import MyTrips from './pages/MyTrips'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import SharedTrip from './pages/SharedTrip'
import Signup from './pages/Signup'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset/:token" element={<ResetPassword />} />
            <Route element={<PublicLayout />}>
              <Route path="/share/:token" element={<SharedTrip />} />
            </Route>
            <Route element={<Layout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trips" element={<MyTrips />} />
                <Route path="/trips/new" element={<CreateTrip />} />
                <Route path="/trips/:id/edit" element={<CreateTrip />} />
                <Route path="/trips/:id" element={<ItineraryView />} />
                <Route path="/trips/:id/build" element={<ItineraryBuilder />} />
                <Route path="/trips/:id/budget" element={<Budget />} />
                <Route path="/explore/cities" element={<CitySearch />} />
                <Route path="/explore/activities" element={<ActivitySearch />} />
                <Route path="/profile" element={<Profile />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
