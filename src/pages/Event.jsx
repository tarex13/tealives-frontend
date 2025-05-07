import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

function Event() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)

  const loadEvent = async () => {
    try {
      const res = await api.get(`events/${id}/`)
      setEvent(res.data)
    } catch (err) {
      console.error('Failed to load event', err)
    }
  }

  const rsvp = async () => {
    try {
      await api.patch(`events/${id}/rsvp/`)
      alert('RSVP confirmed!')
    } catch {
      alert('RSVP failed.')
    }
  }

  useEffect(() => {
    loadEvent()
  }, [id])

  if (!event) return <p className="p-6">Loading event...</p>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
      <p className="text-sm text-gray-500 mb-2">
        {new Date(event.datetime).toLocaleString()} @ {event.location}
      </p>
      <p className="mb-4">{event.description}</p>

      {user && (
        <button
          onClick={rsvp}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          RSVP to this event
        </button>
      )}
    </div>
  )
}

export default Event
