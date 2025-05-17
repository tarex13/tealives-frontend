import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Event() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const loadEvent = async () => {
    try {
      const res = await api.get(`events/${id}/`);
      setEvent(res.data);
      updateTimeLeft(res.data.datetime);
    } catch (err) {
      console.error('Failed to load event', err);
    }
  };

  const updateTimeLeft = (datetime) => {
    const eventTime = new Date(datetime).getTime();
    const now = new Date().getTime();
    const diff = eventTime - now;
    setTimeLeft(diff > 0 ? diff : 0);
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!event?.show_countdown) return;

    const interval = setInterval(() => {
      updateTimeLeft(event.datetime);
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const rsvp = async () => {
    try {
      await api.patch(`events/${id}/rsvp/`);
      alert('RSVP confirmed!');
    } catch {
      alert('RSVP failed.');
    }
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

  if (!event) return <p className="p-6">Loading event...</p>;

  const eventPassed = new Date() - new Date(event.datetime) > 3600 * 1000; // Passed over 1 hour ago
  const countdownColor = timeLeft <= 3600 * 1000 ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
      <p className="text-sm text-gray-500 mb-2">
        {new Date(event.datetime).toLocaleString()} @ {event.location}
      </p>
      <p className="mb-4">{event.description}</p>

      {/* Countdown Section */}
      {event.show_countdown && (
        <div className={`font-semibold mb-4 ${countdownColor}`}>
          ⏳ {formatCountdown(timeLeft)}
        </div>
      )}

      {/* RSVP or Event Has Passed */}
      {!eventPassed && user && (
        <button
          onClick={rsvp}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          RSVP to this event
        </button>
      )}

      {eventPassed && (
        <div className="text-gray-600 font-semibold mt-4">🚫 Event Has Passed</div>
      )}
    </div>
  );
}

export default Event;
