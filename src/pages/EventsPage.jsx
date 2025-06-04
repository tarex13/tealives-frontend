// ── src/pages/EventsPage.jsx ──
import React, { useEffect, useState } from 'react';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { toggleRSVP } from '../requests';

export default function EventsPage() {
  const { city } = useCity();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1) Fetch events for current city
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`events/?city=${city}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [city]);

  // 2) Countdown helper
  const formatCountdown = (datetime) => {
    const diff = new Date(datetime) - new Date();
    if (diff < 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h`;
  };

  // 3) Toggle RSVP
  const handleRSVP = async (eventId, hasRSVPed) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await toggleRSVP(eventId);
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          const newHas = !hasRSVPed;
          const delta = newHas ? +1 : -1;
          return {
            ...evt,
            has_rsvped: newHas,
            rsvp_count: (evt.rsvp_count || 0) + delta,
          };
        })
      );
    } catch (err) {
      console.error('Error toggling RSVP:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">
          Events in {city}
        </h1>
        {user && (
          <button
            onClick={() => navigate('/events/create')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md shadow transition"
          >
            + Create Event
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading events...</p>}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}
      {!loading && events.length === 0 && !error && (
        <p className="text-gray-500">No events found.</p>
      )}

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const countdown = event.show_countdown
            ? formatCountdown(event.datetime)
            : null;

          return (
            <div
              key={event.id}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition group"
            >
              {/* Banner */}
              {event.banner_url && (
                <div className="relative overflow-hidden">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Title */}
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h2>

                {/* Date & Location */}
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-2">
                  <FaClock className="mr-1" />
                  <span>{new Date(event.datetime).toLocaleString()}</span>
                  <span className="mx-2">•</span>
                  <FaMapMarkerAlt className="mr-1" />
                  <span>{event.location}</span>
                </div>

                {/* Countdown */}
                {countdown && (
                  <p className="text-xs text-purple-600 font-semibold mb-2">
                    Starts in: {countdown}
                  </p>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
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
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Spacer pushes button & footer down */}
                <div className="flex-1" />

                {/* RSVP Button */}
                <div className="mb-4">
                  <button
                    onClick={() =>
                      handleRSVP(event.id, event.has_rsvped)
                    }
                    className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white py-2 rounded-lg shadow ${
                      event.has_rsvped
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-indigo-700'
                    } transition`}
                  >
                    {event.has_rsvped ? (
                      <>
                        <FaTimesCircle className="h-5 w-5" /> Cancel
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="h-5 w-5" /> RSVP
                      </>
                    )}
                  </button>
                </div>

                {/* Footer: Public/Private + RSVP Count + Minimum Age */}
                <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span
                    className={`px-2 py-1 rounded-full font-semibold ${
                      event.is_public
                        ? 'px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800'
                        : 'px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {event.is_public ? 'Public' : 'Private'}
                  </span>

                  <span>
                    {event.rsvp_count} RSVP
                    {event.rsvp_count !== 1 ? 's' : ''}
                  </span>

                  {event.minimum_age && (
                    <span className="w-full mt-2 text-red-500 font-medium">
                      Minimum Age: {event.minimum_age}+
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
