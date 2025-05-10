import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function EditProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    bio: '',
    city: '',
    profile_image: null,
    preview: null, // For image preview
  });

  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('user/profile/');
        setForm({ 
          ...res.data, 
          profile_image: null, 
          preview: res.data.profile_image_url || null // Assuming your API sends this
        });
      } catch (err) {
        console.error('Error loading profile');
      }
    };

    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_image') {
      const file = files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        alert('Image size must be under 5MB.');
        return;
      }
      setForm({
        ...form,
        profile_image: file,
        preview: URL.createObjectURL(file),
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('bio', form.bio);
      formData.append('city', form.city);
      if (form.profile_image) {
        formData.append('profile_image', form.profile_image);
      }

      await api.put('user/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Update failed. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Edit Your Profile</h1>

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center animate-pulse">
          🎉 Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* City Field */}
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="City"
          className="w-full border p-2 rounded"
        />

        {/* Bio Field */}
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Tell us about yourself..."
          className="w-full border p-2 rounded h-32"
        />

        {/* Profile Image Upload */}
        <label className="block w-full p-4 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
          <span className="text-gray-600">
            {form.preview ? 'Change Profile Picture' : 'Click or Drag & Drop Profile Picture'}
          </span>
          <input
            type="file"
            name="profile_image"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </label>

        {/* Image Preview */}
        {form.preview && (
          <div className="flex justify-center mb-4">
            <img
              src={form.preview}
              alt="Profile Preview"
              className="w-32 h-32 object-cover rounded-full shadow"
            />
          </div>
        )}

        {/* Progress Bar */}
        {submitting && (
          <div className="flex flex-col items-center space-y-2 mt-4">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-700">{uploadProgress}%</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
