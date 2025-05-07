import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import Event from './pages/Event'
import Login from './pages/Login'
import Register from './pages/Register'
import MySwapps from './pages/MySwapps'
import Inbox from './pages/Inbox'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Navbar from './components/Navbar'
import ModPanel from './pages/ModPanel'
import CitySelector from './components/CitySelector'
import PrivateRoute from './components/PrivateRoute'
import PageNotFound from './pages/PageNotFound'
import SavedListings from './pages/SavedListings'
import FeedbackForm from './components/FeedbackForm'
import EventsPage from './pages/EventsPage'
import TermsPage from './pages/TermsPage'
import Leaderboard from './pages/Leaderboard'

function EventCard({ event }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 mb-3 rounded shadow">
      <h3 className="font-bold">{event.title}</h3>
      <p className="text-sm">{event.description}</p>
      <p className="text-xs text-gray-500">{new Date(event.datetime).toLocaleString()}</p>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />
      <Routes>
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route
  path="/mod"
  element={
    <PrivateRoute>
      <ModPanel />
    </PrivateRoute>
  }
/>
        <Route path="/" element={<Home />} />
        <Route
  path="/inbox"
  element={
    <PrivateRoute>
      <Inbox />
    </PrivateRoute>
  }
/>
<Route path="/events" element={<EventsPage />} />
        <Route path="/event/:id" element={<Event />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
  path="/profile"
  element={
    <PrivateRoute>

      <Profile />
    </PrivateRoute>
  }
/>
        <Route path="/profile/:id" element={<PublicProfile />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
  path="/my-swapps"
  element={
    <PrivateRoute>
      <MySwapps />
    </PrivateRoute>
  }
/>
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route
  path="/saved"
  element={
    <PrivateRoute>
      <SavedListings />
    </PrivateRoute>
  }
/>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </div>
  )
}

export default App
