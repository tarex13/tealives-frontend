import React, { useState } from 'react';
import { toggleRSVP } from '../requests';
import { useAuth } from '../context/AuthContext';

function EventCard({ event }) {
  const { user } = useAuth();
  const [rsvpList, setRsvpList] = useState(event.rsvps || []);
  const [rsvpCount, setRsvpCount] = useState(event.rsvp_count || 0);
  const [hidden, setHidden] = useState(false);

  const isAttending = rsvpList.some((u) => u.id === user?.user?.id);

  const handleRSVP = async () => {
    try {
      await toggleRSVP(event.id);

      if (isAttending) {
        // Cancel RSVP
        setRsvpList((prev) => prev.filter((u) => u.id !== user.user.id));
        setRsvpCount((prev) => Math.max(0, prev - 1));
      } else {
        // Add RSVP
        setRsvpList((prev) => [...prev, user.user]);
        setRsvpCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle RSVP:', err);
    }
  };

  const handleNotInterested = () => {
    setHidden(true);
  };

  if (hidden) return null;

  // RSVP Count Color Coding
  const getRSVPColor = () => {
    if (rsvpCount < 5) return 'text-gray-600';
    if (rsvpCount < 15) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-3">
      <h3 className="text-lg font-bold">{event.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
      <p className="text-sm text-gray-400 mb-4">
        {new Date(event.datetime).toLocaleString()} at {event.location}
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={handleRSVP}
          className={`px-3 py-1 rounded text-white ${
            isAttending ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isAttending ? 'Cancel RSVP' : 'RSVP'}
        </button>

        <button
          onClick={handleNotInterested}
          className="px-3 py-1 rounded bg-gray-400 text-white hover:bg-gray-500"
        >
          Not Interested
        </button>

        <span className={`text-sm font-medium ${getRSVPColor()}`}>
          {rsvpCount} {rsvpCount === 1 ? 'person attending' : 'people attending'}
        </span>
      </div>
    </div>
  );
}

export default EventCard;
