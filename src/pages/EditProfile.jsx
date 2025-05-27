import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ProfileImageUploader from '../components/ProfileImageUploader';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { CITIES, BUSINESS_TYPES } from '../../constants';

const USERNAME_CHANGE_LIMIT_DAYS = 30;
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    username: '',
    email: '',
    city: '',
    bio: '',
    dob: '',
    gender: '',
    phone_number: '',
    display_name: '',
    website: '',
    instagram: '',
    twitter: '',
    facebook: '',
    profile_image: null,
    logo: null,
    is_business: false,
    business_type: '',
    business_name: '',
    business_description: '',
    business_locations: '',
    business_hours: {},
  });
  const [initialAvatarUrl, setInitialAvatarUrl] = useState(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState(null);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // 1️⃣ Load profile
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('user/profile/');
        const d = res.data;
        setForm({
          username: d.username,
          email: d.email,
          city: d.city || '',
          bio: d.bio || '',
          dob: d.dob || '',
          gender: d.gender || '',
          phone_number: d.phone_number || '',
          display_name: d.display_name || '',
          website: d.website || '',
          instagram: d.instagram || '',
          twitter: d.twitter || '',
          facebook: d.facebook || '',
          profile_image: null,
          logo: null,
          is_business: d.is_business,
          business_type: d.business_type || '',
          business_name: d.business_name || '',
          business_description: d.business_description || '',
          business_locations: (d.business_locations || []).join('\n'),
          business_hours: d.business_hours || {},
        });
        setInitialAvatarUrl(d.profile_image_url || null);
        setInitialLogoUrl(d.logo_url || null);

        // username cooldown
        if (d.last_username_change) {
          const last = new Date(d.last_username_change);
          const days = Math.floor(
            (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days < USERNAME_CHANGE_LIMIT_DAYS) {
            setCanChangeUsername(false);
            setDaysUntilChange(USERNAME_CHANGE_LIMIT_DAYS - days);
          }
        }
      } catch {
        setError('Failed to load profile.');
      }
    })();
  }, []);

  // Handlers
  const handleImageCropped = (blob, previewUrl) => {
    setForm(f => ({ ...f, profile_image: blob }));
    setInitialAvatarUrl(previewUrl);
  };
  const handleLogoChange = e => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, logo: file }));
      setInitialLogoUrl(URL.createObjectURL(file));
    }
  };
  const handleHourChange = (day, val) => {
    setForm(f => ({
      ...f,
      business_hours: { ...f.business_hours, [day]: val }
    }));
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    if (form.bio.length > 300) errs.bio = 'Bio must be under 300 chars.';
    if (form.is_business && !form.business_name.trim()) {
      errs.business_name = 'Business name is required.';
    }
    setValidationErrors(errs);
    return !Object.keys(errs).length;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries({
        email: form.email,
        city: form.city,
        bio: form.bio,
        dob: form.dob,
        gender: form.gender,
        display_name: form.display_name,
        website: form.website,
        instagram: form.instagram,
        twitter: form.twitter,
        facebook: form.facebook,
        phone_number: form.phone_number,
      }).forEach(([k, v]) => fd.append(k, v || ''));

      if (form.profile_image) fd.append('profile_image', form.profile_image);
      if (canChangeUsername) fd.append('username', form.username);

      if (form.is_business) {
        fd.append('is_business', 'true');
        fd.append('business_type', form.business_type);
        fd.append('business_name', form.business_name);
        fd.append('business_description', form.business_description);
        fd.append(
          'business_locations',
          JSON.stringify(form.business_locations.split('\n').filter(Boolean))
        );
        fd.append('business_hours', JSON.stringify(form.business_hours));
        if (form.logo) fd.append('logo', form.logo);
      }

      const res = await api.put('user/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      showNotification('Profile updated!', 'success');
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate your account?')) {
      try {
        await api.delete('user/account/');
        window.location.href = '/login';
      } catch {
        showNotification('Failed to deactivate account.', 'error');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white dark:bg-gray-800 shadow rounded">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Edit Your Profile
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* Avatar */}
      <ProfileImageUploader
        previewUrl={initialAvatarUrl}
        onImageCropped={handleImageCropped}
      />

      {/* Business Toggle */}
      <div className="mt-4 flex items-center">
        <input
          id="isBusiness"
          type="checkbox"
          checked={form.is_business}
          onChange={() => setForm(f => ({ ...f, is_business: !f.is_business }))}
          className="mr-2"
        />
        <label htmlFor="isBusiness" className="text-sm">
          Enable Business Profile
        </label>
      </div>

      {/* Business Logo */}
      {form.is_business && (
        <div className="mt-4 text-center">
          <label className="block text-sm font-medium mb-1">
            Business Logo
          </label>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {initialLogoUrl && (
            <img
              src={initialLogoUrl}
              alt="Logo Preview"
              className="mt-2 mx-auto w-24 h-24 object-cover rounded"
            />
          )}
        </div>
      )}

      <form onSubmit={e => e.preventDefault()} className="space-y-4 mt-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="input-style"
            required
          />
          {validationErrors.email && (
            <p className="text-red-600">{validationErrors.email}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium">Username *</label>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            disabled={!canChangeUsername}
            className="input-style"
            required
          />
          {!canChangeUsername && (
            <p className="text-xs text-gray-500">
              You can change again in {daysUntilChange} day
              {daysUntilChange !== 1 ? 's' : ''}.
            </p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium">Display Name</label>
          <input
            value={form.display_name}
            onChange={e =>
              setForm(f => ({ ...f, display_name: e.target.value }))
            }
            className="input-style"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium">City *</label>
          <select
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="input-style"
            required
          >
            <option value="">Select City</option>
            {CITIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {validationErrors.city && (
            <p className="text-red-600">{validationErrors.city}</p>
          )}
        </div>

        {/* Phone & DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Phone Number</label>
            <PhoneInput
              defaultCountry="CA"
              value={form.phone_number}
              onChange={val => setForm(f => ({ ...f, phone_number: val }))}
              className="input-style"
              placeholder="+1 204 555 6789"
            />
          </div>
          <div>
            <label className="block text-sm">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
              className="input-style"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm">Gender</label>
          <select
            value={form.gender}
            onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
            className="input-style"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Socials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="url"
            placeholder="Website"
            value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            className="input-style"
          />
          <input
            type="url"
            placeholder="Instagram"
            value={form.instagram}
            onChange={e =>
              setForm(f => ({ ...f, instagram: e.target.value }))
            }
            className="input-style"
          />
          <input
            type="url"
            placeholder="Twitter"
            value={form.twitter}
            onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))}
            className="input-style"
          />
          <input
            type="url"
            placeholder="Facebook"
            value={form.facebook}
            onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))}
            className="input-style"
          />
        </div>

        {/* Business-only */}
        {form.is_business && (
          <>
            <hr className="my-6 border-gray-300 dark:border-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Business Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={form.business_type}
                onChange={e =>
                  setForm(f => ({ ...f, business_type: e.target.value }))
                }
                className="input-style"
              >
                <option value="">Select Business Type</option>
                {BUSINESS_TYPES.map(bt => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Business Name"
                value={form.business_name}
                onChange={e =>
                  setForm(f => ({ ...f, business_name: e.target.value }))
                }
                className="input-style"
              />
            </div>

            <textarea
              placeholder="Business Description"
              value={form.business_description}
              onChange={e =>
                setForm(f => ({ ...f, business_description: e.target.value }))
              }
              className="input-style h-24"
            />

            <textarea
              placeholder="Locations (one per line)"
              value={form.business_locations}
              onChange={e =>
                setForm(f => ({ ...f, business_locations: e.target.value }))
              }
              className="input-style h-28"
            />

            <div className="space-y-2 mt-4">
              {DAYS.map(day => (
                <div key={day}>
                  <label className="block text-sm">{day}</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 5:00 PM or Closed"
                    value={form.business_hours[day] || ''}
                    onChange={e => handleHourChange(day, e.target.value)}
                    className="input-style"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Save & Deactivate */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleDeactivate}
          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Deactivate Account
        </button>
      </form>
    </div>
  );
}
