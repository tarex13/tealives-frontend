import React from 'react';

export default function ProfileForm({ form, setForm }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
        <input
          name="city"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Your city"
        />
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
      </div>
    </>
  );
}
