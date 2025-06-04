// src/pages/TopSellerOfMonth.jsx
import React, { useEffect, useState } from 'react';
import { fetchTopSellerMonth } from '../requests';
import { useNavigate } from 'react-router-dom';

export default function TopSellerOfMonth() {
  const [top, setTop] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopSeller();
  }, []);

  const loadTopSeller = async () => {
    setLoading(true);
    try {
      const res = await fetchTopSellerMonth();
      setTop(res.data);
    } catch (err) {
      console.error('Failed to load top seller of month:', err);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  if (!top || top.detail) return <p className="text-gray-500 dark:text-gray-400">No sales in the past month.</p>;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow text-center">
      <h2 className="text-2xl font-bold mb-4">Top Seller of the Month</h2>
      <p className="text-lg text-gray-900 dark:text-gray-100 mb-2">
        <span
          className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => navigate(`/profile/${top.user_id}`)}
        >
          {top.username}
        </span>
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {top.num_sales} sales in the last 30 days
      </p>
    </div>
  );
}
