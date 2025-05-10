import React, { useState } from 'react'
import { toggleRSVP } from '../requests'
import { useAuth } from '../context/AuthContext'

function EventCard({ event }) {
  const { user } = useAuth()
  const [rsvpList, setRsvpList] = useState(event.rsvps || [])
  const [rsvpCount, setRsvpCount] = useState(event.rsvp_count || 0)

  const isAttending = rsvpList.some((u) => u.id === user?.user?.id)

  const handleRSVP = async () => {
    try {
      await toggleRSVP(event.id)

      if (isAttending) {
        // Cancel RSVP
        setRsvpList((prev) => prev.filter((u) => u.id !== user.user.id))
        setRsvpCount((prev) => Math.max(0, prev - 1))
      } else {
        // Add RSVP
        setRsvpList((prev) => [...prev, user.user])
        setRsvpCount((prev) => prev + 1)
      }
    } catch (err) {
      console.error('Failed to toggle RSVP:', err)
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-3">
      <h3 className="text-lg font-bold">{event.title}</h3>
      <p className="text-sm text-gray-600">{event.description}</p>
      <p className="text-sm text-gray-400">
        {new Date(event.datetime).toLocaleString()} at {event.location}
      </p>

      <button
        onClick={handleRSVP}
        className={`mt-2 px-3 py-1 rounded ${
          isAttending
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        <p className="text-sm text-white">
          {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} attending
        </p>
        {isAttending ? 'Cancel RSVP' : 'RSVP'}
      </button>
    </div>
  )
}

export default EventCard
