// src/pages/MyBadges.jsx
import React, { useEffect, useState } from 'react';
import { fetchMyBadges } from '../requests';
import { useAuth } from '../context/AuthContext';

export default function MyBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const res = await fetchMyBadges();
      const payload = res.data;
      // Normalize to an array even if API returns an object
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.results)
        ? payload.results
        : [];
      setBadges(list);
    } catch (err) {
      console.error('Failed to load badges:', err);
      setBadges([]);
    }
    setLoading(false);
  };

  if (!user)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-6">
        Please log in to view your badges.
      </p>
    );
  if (loading)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-6">
        Loading badges…
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        My Badges
      </h2>
      {badges.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          You haven’t earned any badges yet.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((b) => (
            <li
              key={b.badge_code}
              className="
                bg-white dark:bg-gray-800
                p-6
                rounded-lg
                shadow-md
                flex
                flex-col
                items-center
                transition-transform
                hover:scale-105
                focus-within:ring-2 focus-within:ring-indigo-500
              "
            >
              <div className="text-yellow-400 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .587l3.668 7.431 8.204 1.192-5.934 5.776 1.402 8.178L12 18.896l-7.34 3.868 1.402-8.178L.129 9.21l8.204-1.192z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                {b.badge_display}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                Awarded{' '}
                {new Date(b.awarded_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
