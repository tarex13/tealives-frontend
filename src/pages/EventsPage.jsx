import { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { Link, useNavigate } from 'react-router-dom'

function EventsPage() {
  const { city } = useCity()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const navigate = useNavigate()

  const loadEvents = async () => {
    try {
      const res = await api.get(`events/?city=${city}`)
      setEvents(res.data)
    } catch (err) {
      console.error('Error loading events:', err)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [city])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Events in {city}</h1>
        {user && (
          <button
            onClick={() => navigate('/events/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        events.map((event) => (
          <Link
            key={event.id}
            to={`/event/${event.id}`}
            className="block bg-white dark:bg-gray-800 p-4 rounded shadow mb-4 hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="text-sm text-gray-600">
              {new Date(event.datetime).toLocaleString()} @ {event.location}
            </p>
            <p className="text-sm mt-1">{event.description.slice(0, 80)}...</p>
          </Link>
        ))
      )}
    </div>
  )
}

export default EventsPage
