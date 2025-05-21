import React, { useEffect, useState } from 'react';
import { createGroupEvent, fetchEvents } from '../requests';
import { useParams } from 'react-router-dom';

const GroupEventsPage = () => {
  const { id: groupId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data.results);
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [groupId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Group Events</h2>
      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found for this group.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="border p-4 rounded bg-white shadow">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p>{event.description}</p>
              <p className="text-sm text-gray-600">{new Date(event.datetime).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupEventsPage;
