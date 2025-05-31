import React, { useState } from 'react';
import { toggleRSVP } from '../requests';
import { useAuth } from '../context/AuthContext';
import {
  FaCalendarAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaEnvelope,
  FaPhone,
  FaTag,
  FaUserShield,
} from 'react-icons/fa';

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
        setRsvpList((prev) => prev.filter((u) => u.id !== user.user.id));
        setRsvpCount((prev) => Math.max(0, prev - 1));
      } else {
        setRsvpList((prev) => [...prev, user.user]);
        setRsvpCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle RSVP:', err);
    }
  };

  const handleNotInterested = () => setHidden(true);

  if (hidden) return null;

  const getRSVPColor = () => {
    if (rsvpCount < 5) return 'text-gray-600';
    if (rsvpCount < 15) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full transition hover:shadow-lg">
      {event.banner_url && (
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-grow space-y-2">
        <div className="flex justify-between text-sm text-indigo-600 dark:text-indigo-300 font-semibold uppercase">
          <div className="flex items-center gap-2">
            <FaCalendarAlt />
            Event
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(event.datetime).toLocaleString()}
          </span>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{event.title}</h2>

        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {event.description || <i className="text-gray-400">No description provided.</i>}
        </p>

        {event.category && (
          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white text-xs font-medium px-2 py-1 rounded-full">
            {event.category}
          </span>
        )}

        {Array.isArray(event.tags) && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white px-2 py-0.5 rounded-full"
              >
                <FaTag className="text-xs" /> #{tag}
              </span>
            ))}
          </div>
        )}

        {event.location && (
          <p className="text-sm text-gray-500 dark:text-gray-400">📍 {event.location}</p>
        )}

        {event.minimum_age && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <FaUserShield /> {event.minimum_age}+
          </p>
        )}

        {event.external_url && (
          <a
            href={event.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            <FaExternalLinkAlt /> Event Page
          </a>
        )}

        {(event.contact_email || event.contact_phone) && (
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {event.contact_email && (
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-gray-500" /> {event.contact_email}
              </p>
            )}
            {event.contact_phone && (
              <p className="flex items-center gap-2">
                <FaPhone className="text-gray-500" /> {event.contact_phone}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 mt-auto border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleRSVP}
            className={`flex items-center gap-1 text-sm font-semibold text-white px-3 py-1.5 rounded transition ${
              isAttending ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isAttending ? <><FaTimesCircle /> Cancel</> : <><FaCheckCircle /> RSVP</>}
          </button>

          <button
            onClick={handleNotInterested}
            className="text-sm text-white bg-gray-500 hover:bg-gray-600 px-3 py-1.5 rounded"
          >
            Not Interested
          </button>

          <span className={`ml-auto text-sm font-medium ${getRSVPColor()}`}>
            {rsvpCount} attending
          </span>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
