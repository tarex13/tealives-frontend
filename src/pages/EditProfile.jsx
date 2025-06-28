// src/pages/EditProfile.jsx

import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ProfileImageUploader from '../components/ProfileImageUploader';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { BUSINESS_TYPES } from '../../constants';
import { useCity } from '../context/CityContext';
import { fetchBusinessTypes } from '../requests';

const USERNAME_CHANGE_LIMIT_DAYS = 30;
const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];
const SOCIAL_PREFIXES = {
  instagram: 'https://instagram.com/',
  twitter: 'https://twitter.com/',
  facebook: 'https://facebook.com/'
};

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const { showNotification } = useNotification();
  const { cities } = useCity();
  const [businessTypes, setBusinessTypes] = useState([]);
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
    social_links: {
      instagram: '',
      twitter: '',
      facebook: ''
    },
    is_private: false,
    profile_image: null,
    logo: null,
    is_business: false,
    business_type: '',
    business_name: '',
    business_description: '',
    business_locations: '',
    business_hours: {},
    business_phone: ''
  });

  const [initialAvatarUrl, setInitialAvatarUrl] = useState(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState(null);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('user/profile/');
        const d = res.data;

        const extractHandle = (url, base) =>
          url?.startsWith(base) ? url.slice(base.length) : '';

        setForm({
          username: d.username,
          email: d.email,
          city: d.city || '',
          bio: d.bio || '',
          dob: d.dob || '',
          gender: d.gender || '',
          phone_number: d.phone_number || '',
          display_name: d.display_name || '',
          website: d.social_links?.website || '',
          is_private: d.is_private || false,
          profile_image: null,
          logo: null,
          is_business: d.is_business,
          business_type: d.business_type || '',
          business_name: d.business_name || '',
          business_description: d.business_description || '',
          business_locations: (d.business_locations || []).join('\n'),
          business_hours: d.business_hours || {},
          business_phone: d.business_phone || '',
          social_links: {
            instagram: extractHandle(
              d.social_links?.instagram,
              SOCIAL_PREFIXES.instagram
            ),
            twitter: extractHandle(
              d.social_links?.twitter,
              SOCIAL_PREFIXES.twitter
            ),
            facebook: extractHandle(
              d.social_links?.facebook,
              SOCIAL_PREFIXES.facebook
            )
          }
        });

        setInitialAvatarUrl(d.profile_image_url || null);
        setInitialLogoUrl(d.logo_url || null);

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

    useEffect(() => {
    fetchBusinessTypes()
      .then(setBusinessTypes)
      .catch(console.error);
  }, []);

  const handleImageCropped = (blob, previewUrl) => {
    setForm((f) => ({ ...f, profile_image: blob }));
    setInitialAvatarUrl(previewUrl);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((f) => ({ ...f, logo: file }));
      setInitialLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleHourChange = (day, val) => {
    setForm((f) => ({
      ...f,
      business_hours: { ...f.business_hours, [day]: val }
    }));
  };

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

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      const socialLinks = {
        instagram: form.social_links.instagram
          ? SOCIAL_PREFIXES.instagram + form.social_links.instagram
          : '',
        twitter: form.social_links.twitter
          ? SOCIAL_PREFIXES.twitter + form.social_links.twitter
          : '',
        facebook: form.social_links.facebook
          ? SOCIAL_PREFIXES.facebook + form.social_links.facebook
          : '',
        website: form.website || ''
      };

      Object.entries({
        email: form.email,
        city: form.city,
        bio: form.bio,
        dob: form.dob,
        gender: form.gender,
        phone_number: form.phone_number,
        display_name: form.display_name,
        is_private: form.is_private
      }).forEach(([k, v]) => fd.append(k, v || ''));

      fd.append('social_links', JSON.stringify(socialLinks));

      if (form.profile_image) fd.append('profile_image', form.profile_image);
      if (canChangeUsername) fd.append('username', form.username);

      if (form.is_business) {
        fd.append('is_business', 'true');
        fd.append('business_type', form.business_type);
        fd.append('business_name', form.business_name);
        fd.append('business_description', form.business_description);
        fd.append('business_phone', form.business_phone);
        fd.append(
          'business_locations',
          JSON.stringify(
            form.business_locations
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
          )
        );
        fd.append('business_hours', JSON.stringify(form.business_hours));
        if (form.logo) fd.append('logo', form.logo);
      }

      const res = await api.patch('user/profile/', fd);
      setUser(res.data);
      showNotification('Profile updated!', 'success');
    } catch(err) {
      console.error('Network error saving profile:', err.response || err);
      setError('Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      window.confirm('Are you sure you want to deactivate your account?')
    ) {
      try {
        await api.delete('user/account/');
        window.location.href = '/authn';
      } catch {
        showNotification('Failed to deactivate account.', 'error');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Edit Your Profile
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded">
          ⚠️ {error}
        </div>
      )}

      <ProfileImageUploader
        previewUrl={initialAvatarUrl}
        onImageCropped={handleImageCropped}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center space-x-2">
          <input
            id="isBusiness"
            type="checkbox"
            checked={form.is_business}
            onChange={() =>
              setForm((f) => ({ ...f, is_business: !f.is_business }))
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Enable Business Profile
          </span>
        </label>

{/*        <label className="flex items-center space-x-2">
          <input
            id="isPrivate"
            type="checkbox"
            checked={form.is_private}
            onChange={() =>
              setForm((f) => ({ ...f, is_private: !f.is_private }))
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Make Profile Private
          </span>
        </label>*/}
      </div>

      {form.is_business && (
        <div className="mt-6 text-center">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Business Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block mx-auto"
          />
          {initialLogoUrl && (
            <img
              src={initialLogoUrl}
              alt="Logo Preview"
              className="mt-2 mx-auto w-24 h-24 object-cover rounded-full shadow-md"
            />
          )}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 mt-8">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {validationErrors.email && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username *
          </label>
          <input
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
            disabled={!canChangeUsername}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
          {!canChangeUsername && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              You can change again in {daysUntilChange} day
              {daysUntilChange !== 1 ? 's' : ''}.
            </p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Display Name
          </label>
          <input
            value={form.display_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, display_name: e.target.value }))
            }
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            City *
          </label>
          <select
            value={form.city}
            onChange={(e) =>
              setForm((f) => ({ ...f, city: e.target.value }))
            }
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {validationErrors.city && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.city}
            </p>
          )}
        </div>

        {/* Phone & DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <PhoneInput
              defaultCountry="CA"
              value={form.phone_number}
              onChange={(val) =>
                setForm((f) => ({ ...f, phone_number: val }))
              }
              className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 204 555 6789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) =>
                setForm((f) => ({ ...f, dob: e.target.value }))
              }
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <select
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({ ...f, gender: e.target.value }))
            }
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_say">Prefer not to say</option>
          </select>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              value={form.website}
              onChange={(e) =>
                setForm((f) => ({ ...f, website: e.target.value }))
              }
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {['instagram', 'twitter', 'facebook'].map((platform) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {platform}
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new URL(SOCIAL_PREFIXES[platform]).hostname + '/'}
                </span>
                <input
                  type="text"
                  placeholder="your_handle"
                  value={form.social_links[platform]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      social_links: {
                        ...f.social_links,
                        [platform]: e.target.value
                      }
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Business-only */}
        {form.is_business && (
          <>
            <hr className="my-6 border-gray-300 dark:border-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Business Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Type
                </label>
                <select
                  value={form.business_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_type: e.target.value }))
                  }
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Business Type</option>
                  {businessTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt.charAt(0).toUpperCase() + bt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Name *
                </label>
                <input
                  type="text"
                  placeholder="Business Name"
                  value={form.business_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_name: e.target.value }))
                  }
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {validationErrors.business_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.business_name}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business Description
              </label>
              <textarea
                placeholder="Business Description"
                value={form.business_description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_description: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 h-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Locations (one per line)
              </label>
              <textarea
                placeholder="Enter each location on a new line"
                value={form.business_locations}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_locations: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 h-28 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6 space-y-4">
              {DAYS.map((day) => (
                <div key={day}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 5:00 PM or Closed"
                    value={form.business_hours[day] || ''}
                    onChange={(e) => handleHourChange(day, e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business Phone
              </label>
              <input
                type="text"
                placeholder="+1 204 555 6789"
                value={form.business_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_phone: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Save & Deactivate */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleDeactivate}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Deactivate Account
          </button>
        </div>
      </form>
    </div>
  );
}
