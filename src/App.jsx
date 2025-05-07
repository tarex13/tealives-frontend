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
import { useCity } from './context/CityContext'
import { useEffect, useState } from 'react'

function CitySelectorModal() {
  const { city, setCity } = useCity()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!city) setVisible(true)
  }, [city])

  const handleSelect = (e) => {
    setCity(e.target.value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h2 className="mb-4 text-xl font-bold">Choose Your City</h2>
        <select onChange={handleSelect} className="w-full p-2 rounded">
          <option>Select a city</option>
          <option value="Toronto">Toronto</option>
          <option value="Vancouver">Vancouver</option>
          <option value="Montreal">Montreal</option>
          <option value="Calgary">Calgary</option>
          {/* Add more */}
        </select>
      </div>
    </div>
  )
}


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
