import React, { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { Link, useNavigate } from 'react-router-dom'

export default function EventsPage() {
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
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setEvents(data)
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

  const formatCountdown = (datetime) => {
    const diff = new Date(datetime) - new Date()
    if (diff < 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    return `${days}d ${hours}h`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Events in {city}
        </h1>
        {user && (
          <button
            onClick={() => navigate('/events/create')}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + Create Event
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading events...</p>}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {!loading && events.length === 0 && !error && (
        <p className="text-gray-500">No events found.</p>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const countdown = event.show_countdown
            ? formatCountdown(event.datetime)
            : null

          return (
            <Link
              to={`/event/${event.slug || event.id}`} // Use slug if available
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition group"
            >
              {event.banner_url && (
<img
  src={event.banner_url}
  alt={event.title}
  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
/>

              )}
              <div className="p-4 space-y-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {new Date(event.datetime).toLocaleString()} @ {event.location}
                </p>

                {countdown && (
                  <p className="text-xs text-purple-600 font-semibold">
                    Starts in: {countdown}
                  </p>
                )}

                {event.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {event.description}
                  </p>
                )}

                {/* Category */}
                {event.category && (
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Category: {event.category}
                  </p>
                )}

                {/* Tags */}
                {event.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-xs">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs mt-3">
                  <span
                    className={`px-2 py-1 rounded-full font-semibold ${
                      event.is_public
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {event.is_public ? 'Public' : 'Private'}
                  </span>

                  {/* RSVP Count */}
                  <span className="text-gray-500 dark:text-gray-400">
                    {event.rsvp_count} RSVP{event.rsvp_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* RSVP Badge */}
                {event.has_rsvped && (
                  <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 font-semibold">
                    ✅ You RSVP’d
                  </p>
                )}

                {/* Minimum Age Badge */}
                {event.minimum_age && (
                  <p className="text-xs mt-1 text-red-500 font-medium">
                    Minimum Age: {event.minimum_age}+
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
