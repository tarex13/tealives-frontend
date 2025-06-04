// src/pages/Leaderboard.jsx
import React, { useEffect, useState } from 'react';
import { fetchLeaderboardListings } from '../requests';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    setLoading(true);
    try {
      const res = await fetchLeaderboardListings();
      setLeaders(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading leaderboard…</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Top Sellers</h2>
      {leaders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No sellers to display.</p>
      ) : (
        <ol className="space-y-4">
          {leaders.map((u, idx) => (
            <li key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 w-8">{idx + 1}.</span>
              <img
                src={u.profile_image || '/default-avatar.png'}
                alt={u.username}
                className="h-10 w-10 rounded-full mx-4 object-cover"
              />
              <div className="flex-1">
                <p
                  className="cursor-pointer text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => navigate(`/profile/${u.id}`)}
                >
                  {u.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{u.average_rating.toFixed(1)} ★</p>
              </div>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">{u.seller_xp} XP</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
