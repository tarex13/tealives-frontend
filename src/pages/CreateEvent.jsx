import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { createEvent } from '../requests';
import { toZonedTime } from 'date-fns-tz';
import {
  FaMapMarkerAlt,
  FaClock,
  FaTag,
  FaUser,
  FaImage,
  FaAngleDown,
  FaAngleUp,
} from 'react-icons/fa';

const TAG_OPTIONS = ['Tech', 'Networking', 'Music', 'Art', 'Fitness', 'Business', 'Social', 'Education'];
const CATEGORY_OPTIONS = ['conference', 'meetup', 'workshop', 'party', 'other'];

function CreateEvent() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    start_time: '',
    rsvp_deadline: '',
    rsvp_limit: '',
    category: 'other',
    tags: [],
    banner: null,
    show_countdown: false,
    external_url: '',
    contact_email: '',
    contact_phone: '',
    minimum_age_required: false,
    minimum_age: '',
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showExtras, setShowExtras] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, tags: options }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, banner: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!form.title || !form.description || !form.location || !form.city || !form.start_time || !form.category) {
      setError('Please fill out all required fields.');
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
      formData.append('city', form.city);
      formData.append('datetime', startTimeUtc.toISOString());
      formData.append('rsvp_deadline', form.rsvp_deadline || '');
      formData.append('rsvp_limit', form.rsvp_limit || '');
      formData.append('category', form.category);
      formData.append('tags', JSON.stringify(form.tags));
      formData.append('show_countdown', form.show_countdown);
      formData.append('external_url', form.external_url);
      formData.append('contact_email', form.contact_email);
      formData.append('contact_phone', form.contact_phone);
      if (form.minimum_age_required) {
        formData.append('minimum_age', form.minimum_age);
      }
      if (form.banner) {
        formData.append('banner', form.banner);
      }

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
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Create an Event</h1>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextInput label="Title *" name="title" value={form.title} onChange={handleChange} required />
        <TextArea label="Description *" name="description" value={form.description} onChange={handleChange} />
        <TextInput label="Location *" name="location" value={form.location} onChange={handleChange} required icon={<FaMapMarkerAlt />} />
        <TextInput label="City *" name="city" value={form.city} onChange={handleChange} required />
        <TextInput type="datetime-local" label="Date & Time *" name="start_time" value={form.start_time} onChange={handleChange} required icon={<FaClock />} />
        <Dropdown label="Category *" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
        <select multiple name="tags" value={form.tags} onChange={handleTagChange} className="w-full mt-1 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white">
          {TAG_OPTIONS.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <Checkbox label="Show countdown on event page" name="show_countdown" checked={form.show_countdown} onChange={handleChange} />

        <div className="border-t pt-4 mt-4">
          <button type="button" onClick={() => setShowExtras(!showExtras)} className="flex items-center gap-2 text-blue-600 font-semibold">
            {showExtras ? <FaAngleUp /> : <FaAngleDown />}
            {showExtras ? 'Hide' : 'Show'} Optional Fields
          </button>

          {showExtras && (
            <div className="space-y-4 mt-4">
              <TextInput type="datetime-local" label="RSVP Deadline" name="rsvp_deadline" value={form.rsvp_deadline} onChange={handleChange} />
              <TextInput type="number" label="Max Attendees" name="rsvp_limit" value={form.rsvp_limit} onChange={handleChange} icon={<FaUser />} />
              <TextInput label="External URL" name="external_url" value={form.external_url} onChange={handleChange} />
              <TextInput label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} />
              <TextInput label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
              <Checkbox label="Minimum Age Requirement" name="minimum_age_required" checked={form.minimum_age_required} onChange={handleChange} />
              {form.minimum_age_required && (
                <TextInput type="number" label="Minimum Age" name="minimum_age" value={form.minimum_age} onChange={handleChange} min={1} />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            <FaImage className="inline mr-1" /> Banner Image
          </label>
          <input type="file" accept="image/*" onChange={handleBannerChange} className="w-full mt-1 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-3 rounded shadow max-h-48 w-full object-cover" />
          )}
        </div>

        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}

// Reusable components
const TextInput = ({ label, name, value, onChange, required = false, type = "text", icon, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {icon && <span className="inline mr-1">{icon}</span>}
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full mt-1 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      {...props}
    />
  </div>
);

const TextArea = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
    <textarea name={name} value={value} onChange={onChange} rows={4} className="w-full mt-1 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
  </div>
);

const Dropdown = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full mt-1 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white">
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  </div>
);

const Checkbox = ({ label, name, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="form-checkbox h-5 w-5 text-blue-600" />
    <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
  </div>
);

export default CreateEvent;
