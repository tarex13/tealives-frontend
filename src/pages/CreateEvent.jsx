// ── src/pages/CreateEvent.jsx ──
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
import { CITIES } from '../../constants'; // <-- read‐only proxy of your city list

const TAG_OPTIONS = [
  'Tech',
  'Networking',
  'Music',
  'Art',
  'Fitness',
  'Business',
  'Social',
  'Education',
];
const CATEGORY_OPTIONS = [
  'conference',
  'meetup',
  'workshop',
  'party',
  'other',
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    city: '', // will be a value from CITIES
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

  // Handle simple field changes (text, checkbox)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle multi‐select tags
  const handleTagChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, tags: options }));
  };

  // Handle banner filepicker + preview
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

    // Required fields check
    if (
      !form.title ||
      !form.description ||
      !form.location ||
      !form.city ||
      !form.start_time ||
      !form.category
    ) {
      setError('Please fill out all required fields (marked with *).');
      setSubmitting(false);
      return;
    }

    // Convert local datetime to UTC ISO:
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
      formData.append('city', form.city.toLowerCase());
      formData.append('datetime', startTimeUtc.toISOString());
      formData.append('rsvp_deadline', form.rsvp_deadline || '');
      formData.append('rsvp_limit', form.rsvp_limit || '');
      formData.append('category', form.category);
      formData.append('tags', JSON.stringify(form.tags)); // backend expects JSON array
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
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Create an Event
      </h1>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <TextInput
          label="Title *"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="My Awesome Event"
        />

        {/* Description */}
        <TextArea
          label="Description *"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your event in detail..."
        />

        {/* Location */}
        <TextInput
          label="Location *"
          name="location"
          value={form.location}
          onChange={handleChange}
          required
          icon={<FaMapMarkerAlt className="inline mr-1 text-gray-500" />}
          placeholder="123 Main St, Suite 100"
        />

        {/* City (dropdown from CITIES) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            City *
          </label>
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select a city…
            </option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <TextInput
          type="datetime-local"
          label="Date & Time *"
          name="start_time"
          value={form.start_time}
          onChange={handleChange}
          required
          icon={<FaClock className="inline mr-1 text-gray-500" />}
        />

        {/* Category */}
        <Dropdown
          label="Category *"
          name="category"
          value={form.category}
          onChange={handleChange}
          options={CATEGORY_OPTIONS}
        />

        {/* Tags (multi‐select) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </label>
          <select
            multiple
            name="tags"
            value={form.tags}
            onChange={handleTagChange}
            className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TAG_OPTIONS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            (Hold <kbd className="px-1 py-0.5 dark:bg-gray-800 dark:text-white rounded text-black">Ctrl</kbd> or{' '}
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 dark:text-white rounded text-black">⌘</kbd> to select multiple)
          </p>
        </div>

        {/* Show Countdown */}
        <Checkbox
          label="Show countdown on event page"
          name="show_countdown"
          checked={form.show_countdown}
          onChange={handleChange}
        />

        {/* Optional Fields (toggle) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="flex items-center gap-2 text-blue-600 font-semibold"
          >
            {showExtras ? <FaAngleUp /> : <FaAngleDown />}
            {showExtras ? 'Hide' : 'Show'} Optional Fields
          </button>

          {showExtras && (
            <div className="space-y-6 mt-4">
              {/* RSVP Deadline */}
              <TextInput
                type="datetime-local"
                label="RSVP Deadline"
                name="rsvp_deadline"
                value={form.rsvp_deadline}
                onChange={handleChange}
              />

              {/* Max Attendees */}
              <TextInput
                type="number"
                label="Max Attendees"
                name="rsvp_limit"
                value={form.rsvp_limit}
                onChange={handleChange}
                icon={<FaUser className="inline mr-1 text-gray-500" />}
                min={1}
              />

              {/* External URL */}
              <TextInput
                label="External URL"
                name="external_url"
                value={form.external_url}
                onChange={handleChange}
                placeholder="https://your-event-page.com"
              />

              {/* Contact Email */}
              <TextInput
                label="Contact Email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="you@example.com"
                type="email"
              />

              {/* Contact Phone */}
              <TextInput
                label="Contact Phone"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />

              {/* Minimum Age */}
              <Checkbox
                label="Minimum Age Requirement"
                name="minimum_age_required"
                checked={form.minimum_age_required}
                onChange={handleChange}
              />
              {form.minimum_age_required && (
                <TextInput
                  type="number"
                  label="Minimum Age"
                  name="minimum_age"
                  value={form.minimum_age}
                  onChange={handleChange}
                  min={1}
                  placeholder="e.g. 18"
                />
              )}
            </div>
          )}
        </div>

        {/* Banner Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            <FaImage className="inline mr-1" /> Banner Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Banner Preview"
              className="mt-3 rounded-lg shadow-sm max-h-48 w-full object-cover"
            />
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full flex justify-center items-center py-3 px-6 text-base font-medium rounded-lg shadow-sm text-white ${
              submitting
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition`}
          >
            {submitting ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Reusable Form Components ───────────────────────────────────────────────────

const TextInput = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  icon,
  placeholder = '',
  ...props
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {icon && <span className="inline-block mr-1">{icon}</span>}
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      {...props}
    />
  </div>
);

const TextArea = ({ label, name, value, onChange, placeholder = '' }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={4}
      placeholder={placeholder}
      className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    />
  </div>
);

const Dropdown = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  </div>
);

const Checkbox = ({ label, name, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
    />
    <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
  </div>
);
