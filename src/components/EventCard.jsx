import { useState } from 'react'
import { rsvpToEvent } from '../api/events'

function EventCard({ event, onRSVP }) {
  const [rsvped, setRsvped] = useState(false)

  const handleRSVP = async () => {
    try {
      await rsvpToEvent(event.id)
      setRsvped(true)
      onRSVP?.(event.id)
    } catch (err) {
      alert('RSVP failed')
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
        disabled={rsvped}
        className={`mt-2 px-3 py-1 rounded ${
          rsvped
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {rsvped ? 'RSVP’d' : 'RSVP'}
      </button>
    </div>
  )
}

export default EventCard
