import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'
import { createEvent, updateEvent, fetchEventDetail } from '../requests'
import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { useAuth } from '../context/AuthContext'
import {
  FaMapMarkerAlt,
  FaClock,
  FaTag,
  FaUser,
  FaImage,
  FaAngleDown,
  FaAngleUp,
} from 'react-icons/fa'
import { useCity } from '../context/CityContext'

const TAG_OPTIONS = [
  { value: 'tech',           label: 'Tech' },
  { value: 'networking',     label: 'Networking' },
  { value: 'music',          label: 'Music' },
  { value: 'art',            label: 'Art' },
  { value: 'fitness',        label: 'Fitness' },
  { value: 'business',       label: 'Business' },
  { value: 'social',         label: 'Social' },
  { value: 'education',      label: 'Education' },
  { value: 'food_drink',     label: 'Food & Drink' },
  { value: 'wellness',       label: 'Wellness' },
  { value: 'family',         label: 'Family' },
  { value: 'outdoors',       label: 'Outdoors' },
  { value: 'marketplace',    label: 'Marketplace' },
  { value: 'charity',        label: 'Charity' },
  { value: 'holiday',        label: 'Holiday' },
  { value: 'startup',        label: 'Startup' },
  { value: 'pets',           label: 'Pets' },
  { value: 'gaming',         label: 'Gaming' },
  { value: 'photography',    label: 'Photography' },
];
export const CATEGORY_OPTIONS = [
  { value: 'music_concerts',        label: 'Music & Concerts' },
  { value: 'food_drink',            label: 'Food & Drink' },
  { value: 'arts_culture',          label: 'Arts & Culture' },
  { value: 'sports_fitness',        label: 'Sports & Fitness' },
  { value: 'classes_workshops',     label: 'Classes & Workshops' },
  { value: 'networking_business',   label: 'Networking & Business' },
  { value: 'family_kids',           label: 'Family & Kids' },
  { value: 'health_wellness',       label: 'Health & Wellness' },
  { value: 'tech_startups',         label: 'Tech & Startups' },
  { value: 'community_civic',       label: 'Community & Civic' },
  { value: 'markets_fairs',         label: 'Markets & Fairs' },
  { value: 'film_media',            label: 'Film & Media' },
  { value: 'outdoors_adventure',    label: 'Outdoors & Adventure' },
  { value: 'holiday_seasonal',      label: 'Holiday & Seasonal' },
  { value: 'charity_fundraising',   label: 'Charity & Fundraising' },
  { value: 'other',                 label: 'Other' },
];


// Helper to convert an ISO datetime string (with offset) to a "yyyy-MM-dd'T'HH:mm" string
function formatForDateTimeLocal(isoString) {
  if (!isoString) return ''
  try {
    // Parse ISO string into a Date. parseISO handles the offset part.
    const parsed = parseISO(isoString)
    // Optionally convert to the user's timezone:
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
    const zoned = toZonedTime(parsed, userTZ)
    // Format as "YYYY-MM-DDTHH:mm" for datetime-local
    return format(zoned, "yyyy-MM-dd'T'HH:mm")
  } catch (err) {
    console.error('Failed to parse/format datetime:', err)
    return ''
  }
}

export default function CreateEvent({ isEdit = false }) {
  const { id: paramId } = useParams()
  const eventId = paramId ? parseInt(paramId, 10) : null
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { cities, city: City } = useCity()

  const { user } = useAuth()
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
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showExtras, setShowExtras] = useState(false)

  // Prefill on edit
  useEffect(() => {
    if (!isEdit) return
    if (!eventId) {
      setError('Invalid event ID.')
      return
    }

    let canceled = false
    setLoading(true)
    fetchEventDetail(eventId)
      .then(data => {
        if (canceled) return
        if (user.id !== data.host.id) {
          showNotification('You’re not allowed to edit this event.', 'error')
          navigate('/')
          return
        }
        // Map server fields to form, formatting datetimes for datetime-local
        setForm({
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          city: data.city || '',
          start_time: formatForDateTimeLocal(data.datetime),
          rsvp_deadline: formatForDateTimeLocal(data.rsvp_deadline),
          rsvp_limit: data.rsvp_limit != null ? String(data.rsvp_limit) : '',
          category: data.category || 'other',
          tags: Array.isArray(data.tags) ? data.tags : [],
          banner: null,
          show_countdown: !!data.show_countdown,
          external_url: data.external_url || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          minimum_age_required: data.minimum_age != null,
          minimum_age: data.minimum_age != null ? String(data.minimum_age) : '',
        })
        if (data.banner_url) {
          setPreviewUrl(data.banner_url)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        if (!canceled) {
          setError('Failed to load event data.')
          setLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [isEdit, eventId, user, navigate, showNotification])

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  const handleTagChange = e => {
    const options = Array.from(e.target.selectedOptions).map(o => o.value)
    setForm(prev => ({ ...prev, tags: options }))
  }
  const handleBannerChange = e => {
    const file = e.target.files[0]
    if (file) {
      setForm(prev => ({ ...prev, banner: file }))
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validate required
    if (
      !form.title ||
      !form.description ||
      !form.location ||
      !form.city ||
      !form.start_time ||
      !form.category
    ) {
      setError('Please fill out all required fields.')
      setSubmitting(false)
      return
    }

    // Convert start_time (local "YYYY-MM-DDTHH:mm") to UTC ISO
    try {
      const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localDate = parseISO(form.start_time) // this interprets as local if no offset
      const utcDate = toZonedTime(localDate, userTZ) // get Date in local tz
      // toZonedTime returns a Date in TZ; but we want to send UTC ISO:
      const isoUtc = utcDate.toISOString()
      // Check future
      if (new Date(isoUtc) < new Date()) {
        setError('Event must be scheduled in the future.')
        setSubmitting(false)
        return
      }
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('location', form.location)
      fd.append('city', form.city.toLowerCase())
      fd.append('datetime', isoUtc)
      fd.append('rsvp_deadline', form.rsvp_deadline ? toZonedTime(parseISO(form.rsvp_deadline), userTZ).toISOString() : '')
      fd.append('rsvp_limit', form.rsvp_limit || '')
      fd.append('category', form.category)
      fd.append('tags', JSON.stringify(form.tags))
      fd.append('show_countdown', form.show_countdown)
      fd.append('external_url', form.external_url)
      fd.append('contact_email', form.contact_email)
      fd.append('contact_phone', form.contact_phone)
      if (form.minimum_age_required) {
        fd.append('minimum_age', form.minimum_age)
      }
      if (form.banner) {
        fd.append('banner', form.banner)
      }

      if (isEdit && eventId) {
        await updateEvent(eventId, fd)
        showNotification('✅ Event updated successfully!', 'success')
        navigate(`/event/${eventId}`)
      } else {
        const res = await createEvent(fd)
        const newId = res.data.id
        showNotification('🎉 Event created successfully!', 'success')
        navigate(`/event/${newId}`)
      }
    } catch (err) {
      console.error('Submit Error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading event…</p>
      </div>
    )
  }
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        {isEdit ? 'Edit Event' : 'Create an Event'}
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

        {/* City dropdown */}
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
            {cities.map((c) => (
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

        {/* Tags multi-select */}
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
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            (Hold <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 dark:text-white text-black">Ctrl</kbd> or{' '}
            <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 dark:text-white text-black">⌘</kbd> to select multiple)
          </p>
        </div>

        {/* Show Countdown */}
        <Checkbox
          label="Show countdown on event page"
          name="show_countdown"
          checked={form.show_countdown}
          onChange={handleChange}
        />

        {/* Optional Extras */}
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
              <TextInput
                type="datetime-local"
                label="RSVP Deadline"
                name="rsvp_deadline"
                value={form.rsvp_deadline}
                onChange={handleChange}
              />
              <TextInput
                type="number"
                label="Max Attendees"
                name="rsvp_limit"
                value={form.rsvp_limit}
                onChange={handleChange}
                icon={<FaUser className="inline mr-1 text-gray-500" />}
                min={1}
              />
              <TextInput
                label="External URL"
                name="external_url"
                value={form.external_url}
                onChange={handleChange}
                placeholder="https://your-event-page.com"
              />
              <TextInput
                label="Contact Email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                type="email"
                placeholder="you@example.com"
              />
              <TextInput
                label="Contact Phone"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
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

        {/* Banner Upload */}
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

        {/* Submit */}
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
            {submitting
              ? isEdit
                ? 'Saving Changes…'
                : 'Creating…'
              : isEdit
              ? 'Save Changes'
              : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
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
)

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
)

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
        <option key={opt.value ? opt.value : opt} value={opt.value ? opt.value : opt}>
          {opt.label ? opt.label : opt}
        </option>
      ))}
    </select>
  </div>
)

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
)
