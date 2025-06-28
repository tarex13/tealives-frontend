{/**This page is good but currently not implemented */}
import React, { useEffect, useState } from 'react';
import { getGroupEvents, createGroupEvent } from '../requests';
import { useParams } from 'react-router-dom';

import { useNotification } from '../context/NotificationContext';


export default function GroupEventsPage() {
  const { id } = useParams();
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [location, setLocation] = useState('');
  const { showNotification } = useNotification();
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await getGroupEvents(id);
      setEvents(response.data);
    } catch {
      showNotification('Failed to load events.', 'error');
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !datetime) {
      return showNotification('Title and date/time required.', 'error');
    }

    try {
      await createGroupEvent(id, { title, datetime, location });
      showNotification('Event created successfully.', 'success');
      setOpen(false);
      setTitle('');
      setDatetime('');
      setLocation('');
      fetchEvents();
    } catch {
      showNotification('Failed to create event.', 'error');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Group Events</h2>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Event
      </button>

      <ul className="mt-4">
        {events.map((event) => (
          <li key={event.id} className="border p-2 my-2 rounded">
            <h3 className="font-bold">{event.title}</h3>
            <p>{new Date(event.datetime).toLocaleString()}</p>
            <p className="text-gray-600">{event.location}</p>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="text-lg font-bold mb-4">Create Event</h3>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
            <textarea
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
            <button
              onClick={handleCreateEvent}
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
            >
              Create
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 text-gray-600 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
