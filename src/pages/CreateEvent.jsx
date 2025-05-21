import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { createEvent } from '../requests';
import { FaMapMarkerAlt, FaClock, FaTag, FaUser } from 'react-icons/fa';
import { toZonedTime } from 'date-fns-tz';

function CreateEvent() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    tags: '',
    rsvp_limit: '',
    banner: null,
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, banner: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!form.title || !form.location || !form.start_time) {
      setError('Please fill out required fields.');
      setSubmitting(false);
      return;
    }

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startTimeUtc = toZonedTime(form.start_time, userTimeZone);

    if (startTimeUtc < new Date()) {
      setError('Event must be scheduled in the future.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('start_time', startTimeUtc.toISOString());
      formData.append('tags', form.tags);
      if (form.rsvp_limit) formData.append('rsvp_limit', form.rsvp_limit);
      if (form.banner) formData.append('banner', form.banner);

      await createEvent(formData);
      showNotification('🎉 Event created successfully!', 'success');
      navigate('/events');
    } catch (err) {
      console.error('Create Event Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">Create an Event</h1>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Optional details about the event..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <FaClock /> Date & Time *
          </label>
          <input
            type="datetime-local"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <FaMapMarkerAlt /> Location *
          </label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <FaUser /> Max Attendees (optional)
          </label>
          <input
            type="number"
            name="rsvp_limit"
            value={form.rsvp_limit}
            onChange={handleChange}
            min={1}
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="e.g. 50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <FaTag /> Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="e.g. tech, networking"
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Banner Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Banner Preview"
              className="mt-3 rounded shadow max-h-48 w-full object-cover"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition disabled:opacity-50"
        >
          {submitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
