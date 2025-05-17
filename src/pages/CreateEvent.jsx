import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function CreateEvent() {
  const { city } = useCity();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    datetime: '',
    location: '',
    rsvp_limit: '',
    show_countdown: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getMinDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };

  const isFutureDate = (datetimeValue) => {
    if (!datetimeValue) return false;
    const [datePart, timePart] = datetimeValue.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const selectedDate = new Date(year, month - 1, day, hour, minute);
    return selectedDate > new Date();
  };

  const validateForm = () => {
    if (!form.title.trim() || form.title.trim().length < 3 || form.title.trim().length > 100) {
      return 'Title must be between 3 and 100 characters.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      return 'Description must be at least 10 characters.';
    }
    if (!isFutureDate(form.datetime)) {
      return 'Please select a future date and time.';
    }
    if (!form.location.trim()) {
      return 'Location is required.';
    }
    if (form.rsvp_limit) {
      const limit = parseInt(form.rsvp_limit, 10);
      if (isNaN(limit) || limit <= 0) {
        return 'RSVP limit must be a positive number.';
      }
    }
    return null;
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      datetime: '',
      location: '',
      rsvp_limit: '',
      show_countdown: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const [datePart, timePart] = form.datetime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      const localDate = new Date(year, month - 1, day, hour, minute);
      const utcIsoString = localDate.toISOString();

      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        datetime: utcIsoString,
        city: city.toLowerCase(),
        rsvp_limit: form.rsvp_limit ? parseInt(form.rsvp_limit, 10) : null,
        show_countdown: !!form.show_countdown,
      };

      await api.post('events/', payload);
      setSuccess(true);
      resetForm();

      // Redirect after 1.5 seconds (optional)
      setTimeout(() => navigate('/events'), 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Event</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">🎉 Event created successfully!</p>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input
          name="title"
          placeholder="Event Title"
          value={form.title}
          onChange={handleChange}
          required
          minLength={3}
          maxLength={100}
          className={`w-full p-2 border rounded ${error?.includes('Title') ? 'border-red-500' : ''}`}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          minLength={10}
          rows={4}
          className={`w-full p-2 border rounded ${error?.includes('Description') ? 'border-red-500' : ''}`}
        />
        <input
          type="datetime-local"
          name="datetime"
          value={form.datetime}
          onChange={handleChange}
          required
          min={getMinDateTime()}
          className={`w-full p-2 border rounded ${error?.includes('date and time') ? 'border-red-500' : ''}`}
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
          className={`w-full p-2 border rounded ${error?.includes('Location') ? 'border-red-500' : ''}`}
        />
        <input
          type="number"
          name="rsvp_limit"
          placeholder="Max attendees (optional)"
          value={form.rsvp_limit}
          onChange={handleChange}
          min="1"
          className={`w-full p-2 border rounded ${error?.includes('RSVP') ? 'border-red-500' : ''}`}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="show_countdown"
            checked={form.show_countdown}
            onChange={handleChange}
          />
          <span>Show countdown to event</span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
