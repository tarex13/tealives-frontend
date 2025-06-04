// src/components/BestTimeToPost.jsx
import React, { useEffect, useState } from 'react';
import { fetchHourlyViews } from '../requests';

export default function BestTimeToPost() {
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHourly();
  }, []);

  const loadHourly = async () => {
    setLoading(true);
    try {
      const res = await fetchHourlyViews();
      setHourly(res.data);
    } catch (err) {
      console.error('Failed to load hourly views:', err);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  if (!hourly.length) return <p className="text-gray-500 dark:text-gray-400">No data yet.</p>;

  // Sort by count desc to find best hour
  const best = hourly.reduce((max, curr) => (curr.count > max.count ? curr : max), hourly[0]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Best Time to Post</h3>
      <p className="text-gray-900 dark:text-gray-100">
        {best.hour}:00 – {best.hour + 1}:00 &nbsp;
        <span className="text-sm text-gray-500 dark:text-gray-400">({best.count} views)</span>
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {hourly.map((h) => (
          <div key={h.hour} className="text-center">
            <p className="font-medium">{h.hour}:00</p>
            <p className="text-gray-500 dark:text-gray-400">{h.count} views</p>
          </div>
        ))}
      </div>
    </div>
  );
}
