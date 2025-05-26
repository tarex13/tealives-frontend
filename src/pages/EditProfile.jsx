import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProfileImageUploader from '../components/ProfileImageUploader';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { CITIES } from '../../constants';

const USERNAME_CHANGE_LIMIT_DAYS = 30;

export default function EditProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    username: '',
    city: '',
    bio: '',
    dob: '',
    gender: '',
    phone_number: '',
    profile_image: null,
    preview: null,
  });

  const [initialImageUrl, setInitialImageUrl] = useState(null);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('user/profile/');
        const data = res.data;
        setForm((prev) => ({
          ...prev,
          ...data,
          preview: data.profile_image_url || null,
        }));

        setInitialImageUrl(data.profile_image_url || null);

        if (data.last_username_change) {
          const lastChange = new Date(data.last_username_change);
          const now = new Date();
          const daysSince = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
          if (daysSince < USERNAME_CHANGE_LIMIT_DAYS) {
            setCanChangeUsername(false);
            setDaysUntilChange(USERNAME_CHANGE_LIMIT_DAYS - daysSince);
          }
        }
      } catch (err) {
        setError('Failed to load profile.');
      }
    };
    loadProfile();
  }, []);

  const handleImageCropped = (blob, previewUrl) => {
    setForm((prev) => ({
      ...prev,
      profile_image: blob,
      preview: previewUrl,
    }));
  };

  const handlePhoneChange = (value) => {
    setForm((prev) => ({ ...prev, phone_number: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.city || form.city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters.';
    }
    if (form.bio && form.bio.length > 300) {
      errors.bio = 'Bio must be under 300 characters.';
    }
    if (!form.username?.trim()) {
      errors.username = 'Username is required.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('city', form.city.trim());
      formData.append('bio', form.bio.trim());
      formData.append('dob', form.dob || '');
      formData.append('gender', form.gender || '');
      formData.append('phone_number', form.phone_number || '');
      if (canChangeUsername) formData.append('username', form.username);
      if (form.profile_image) {
        formData.append('profile_image', form.profile_image, 'avatar.jpg');
      }

      await api.put('user/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (confirm('Are you sure you want to deactivate your account?')) {
      await api.delete('user/account/');
      alert('Account deactivated.');
      window.location.href = '/login';
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 bg-white dark:bg-gray-800 shadow rounded">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Edit Your Profile</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-sm rounded">
          ✅ Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 text-sm rounded">
          ⚠️ {error}
        </div>
      )}

      <ProfileImageUploader previewUrl={initialImageUrl} onImageCropped={handleImageCropped} />

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
          <input
            name="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            disabled={!canChangeUsername}
            className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Choose a unique username"
          />
          {!canChangeUsername && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You can change your username in {daysUntilChange} day{daysUntilChange !== 1 ? 's' : ''}.
            </p>
          )}
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City <span className="text-red-500">*</span></label>
          <select
            name="city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">Select City</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          {validationErrors.city && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
          <PhoneInput
            defaultCountry="CA"
            value={form.phone_number}
            onChange={handlePhoneChange}
            className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="+1 204 555 6789"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter number including area code. Format: +1 204 555 6789
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={form.dob || ''}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
          <select
            name="gender"
            value={form.gender || ''}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full px-4 py-2 border rounded h-28 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Tell us a bit about yourself..."
          />
          {validationErrors.bio && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.bio}</p>
          )}
        </div>

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
