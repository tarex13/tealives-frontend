import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Event() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadEvent = async () => {
    try {
      const res = await api.get(`events/${id}/`);
      setEvent(res.data);
      updateTimeLeft(res.data.datetime);
    } catch (err) {
      console.error('Failed to load event', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = (datetime) => {
    const eventTime = new Date(datetime).getTime();
    const now = new Date().getTime();
    const diff = eventTime - now;
    setTimeLeft(diff > 0 ? diff : 0);
  };

  const formatCountdown = (ms) => {
    if (ms <= 0) return 'Event Started';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleRsvp = async () => {
    try {
      const res = await api.patch(`events/${id}/rsvp/`);
      setRsvpStatus(res.data.message);
      loadEvent();
    } catch (err) {
      console.error('RSVP failed:', err);
      setRsvpStatus('RSVP failed.');
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!event?.show_countdown) return;
    const interval = setInterval(() => updateTimeLeft(event.datetime), 1000);
    return () => clearInterval(interval);
  }, [event]);

  if (loading) return <p className="p-6 text-center text-gray-500">Loading event...</p>;
  if (!event) return <p className="p-6 text-center text-red-500">Event not found.</p>;

  const eventDate = new Date(event.datetime);
  const eventPassed = new Date() - eventDate > 3600 * 1000;
  const countdownColor = timeLeft <= 3600 * 1000 ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        {/* Banner */}
        {event.banner_url && (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-6 space-y-6">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>

          {/* Date & Location */}
          <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2">
            <span>{eventDate.toLocaleString()}</span>
            <span>•</span>
            <span>{event.location}</span>
            {event.category && (
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded dark:bg-indigo-700 dark:text-white">
                {event.category}
              </span>
            )}
          </div>

          {/* Countdown */}
          {event.show_countdown && (
            <div className={`font-semibold ${countdownColor}`}>
              ⏳ {formatCountdown(timeLeft)}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Tags */}
          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white text-xs px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* RSVP Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {event.rsvp_count} RSVP{event.rsvp_count !== 1 ? 's' : ''}
                {event.rsvp_limit && ` / ${event.rsvp_limit} max`}
              </span>
              {event.has_rsvped && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">
                  RSVP’d
                </span>
              )}
            </div>

            {!eventPassed && user && (
              <button
                onClick={handleRsvp}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition"
              >
                RSVP to this event
              </button>
            )}
          </div>

          {/* RSVP Feedback */}
          {rsvpStatus && (
            <p className="text-sm text-blue-600 dark:text-blue-400">{rsvpStatus}</p>
          )}

          {/* Event Passed */}
          {eventPassed && (
            <div className="text-red-600 font-medium text-sm">🚫 This event has already passed</div>
          )}

          {/* Optional Info */}
          <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 space-y-2">
            {event.minimum_age && <p>🔞 Minimum Age: {event.minimum_age}+</p>}
            {event.external_url && (
              <p>
                🌐 External Link:{' '}
                <a
                  href={event.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {event.external_url}
                </a>
              </p>
            )}
            {event.contact_email && <p>📧 Contact: {event.contact_email}</p>}
            {event.contact_phone && <p>📞 Phone: {event.contact_phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Event;
