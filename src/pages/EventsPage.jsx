import React, { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { Link, useNavigate } from 'react-router-dom'

function EventsPage() {
  const { city } = useCity()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const loadEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`events/?city=${city}`)

      let eventList = []
      if (Array.isArray(res.data)) {
        eventList = res.data
      } else if (Array.isArray(res.data?.results)) {
        eventList = res.data.results
      }

      setEvents(eventList)
    } catch (err) {
      console.error('Error loading events:', err)
      setError('Failed to load events. Please try again.')
    } finally {
      setLoading(false)
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Create Event
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading events...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <p>No events found.</p>
      )}

      {Array.isArray(events) &&
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
            <p className="text-sm mt-1">
              {event.description ? event.description.slice(0, 80) + '...' : ''}
            </p>
          </Link>
        ))}
    </div>
  )
}

export default EventsPage
