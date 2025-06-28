{/**Currently not being used */}
// src/pages/MyRatings.jsx
import React, { useEffect, useState } from 'react';
import { createRating, fetchUserRatings } from '../requests';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StarIcon } from '@heroicons/react/24/outline';

export default function MyRatings() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ to_user: userId, rating: 5, comment: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [userId]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const res = await fetchUserRatings(userId);
      setRatings(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load ratings:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) return alert('Comment cannot be empty.');
    try {
      await createRating(form);
      setShowForm(false);
      setForm({ to_user: userId, rating: 5, comment: '' });
      loadRatings();
    } catch (err) {
      console.error('Submit rating failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ratings for User #{userId}</h2>
      {user && parseInt(userId, 10) !== user.id && (
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-4"
        >
          {showForm ? 'Cancel' : 'Leave a Rating'}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) })}
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {Array(n).fill('★').join('')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
            <textarea
              rows={3}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowForm(false)}
              type="button"
              className="px-4 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading ratings…</p>
      ) : ratings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No ratings yet.</p>
      ) : (
        <ul className="space-y-4">
          {ratings.map((r) => (
            <li key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <strong>{r.from_user.username}</strong> rated{' '}
                <span className="text-yellow-500">
                  {r.rating} <StarIcon className="h-4 w-4 inline" />
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.comment}</p>
              <p className="text-2xs text-gray-400 dark:text-gray-500 mt-2">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
