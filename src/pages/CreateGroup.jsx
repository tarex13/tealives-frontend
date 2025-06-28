import React, { useState } from 'react';
import { createGroup } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';

export default function CreateGroup() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    category: '',
    is_public: true,
    max_members: 100,
    avatar: null,
  });

  const [loading, setLoading] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const { showNotification } = useNotification();
  const { cities } = useCity();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      city: '',
      category: '',
      is_public: true,
      max_members: 100,
      avatar: null,
    });
    setShowInviteSection(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple rapid submissions

    if (!form.name.trim() || form.name.length < 3) {
      showNotification('Group name must be at least 3 characters long.', 'error');
      return;
    }
    if (!form.description.trim()) {
      showNotification('Description is required.', 'error');
      return;
    }
    if (form.max_members < 2 || form.max_members > 10000) {
      showNotification('Max members must be between 2 and 10,000.', 'error');
      return;
    }
    if (form.avatar) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(form.avatar.type)) {
        showNotification('Only JPG, PNG, or WEBP images are allowed for avatars.', 'error');
        return;
      }
      if (form.avatar.size > 5 * 1024 * 1024) {
        showNotification('Avatar image must be under 5MB.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value);
      });

      await createGroup(formData);
      showNotification(
        form.is_public ? 'Group created! Pending approval.' : 'Private group created!',
        'success'
      );
      setShowInviteSection(true);
    } catch (err) {
      showNotification('Failed to create group. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (window.confirm('Are you sure you want to skip inviting members?')) {
      resetForm();
      navigate('/groups');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Create a New Group</h2>

      {!showInviteSection ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="group-name" className="block font-medium mb-1">Group Name</label>
            <input
              id="group-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Group Name"
              className={`border p-2 w-full rounded ${
                (!form.name.trim() || form.name.length < 3) && 'border-red-500'
              }`}
              required
            />
          </div>

          <div>
            <label htmlFor="group-description" className="block font-medium mb-1">Description</label>
            <textarea
              id="group-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Group Description"
              rows="4"
              className={`border p-2 w-full rounded ${
                !form.description.trim() && 'border-red-500'
              }`}
              required
            />
          </div>

          <div>
            <label htmlFor="city-select" className="block font-medium mb-1">City (Optional)</label>
            <select
              id="city-select"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block font-medium mb-1">Category (Optional)</label>
            <input
              id="category"
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category"
              className="border p-2 w-full rounded"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_public"
              id="is_public"
              checked={form.is_public}
              onChange={handleChange}
            />
            <label htmlFor="is_public">Make Group Public (Requires Approval)</label>
          </div>

          <div>
            <label htmlFor="max-members" className="block font-medium mb-1">Max Members (Optional)</label>
            <input
              id="max-members"
              type="number"
              name="max_members"
              value={form.max_members}
              onChange={handleChange}
              placeholder="Max Members"
              className="border p-2 w-full rounded"
              min="2"
              max="10000"
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block font-medium mb-1">Group Banner (Optional)</label>
            <input
              id="avatar"
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
          </div>

          <button
            type="submit"
            className={`w-full p-2 rounded text-white ${
              loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
            disabled={
              loading ||
              !form.name.trim() ||
              form.name.length < 3 ||
              !form.description.trim() ||
              form.max_members < 2
            }
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Group Created Successfully!</h3>
          <p className="text-gray-600">Would you like to invite members now?</p>
          <button
            onClick={() => showNotification('Invite functionality not implemented yet!', 'info')}
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
          >
            Invite Members
          </button>
          <button
            onClick={handleFinish}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-400 transition"
          >
            Skip for Now
          </button>
        </div>
      )}
    </div>
  );
}
