import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSellerAnalytics, fetchBestTimeToPost } from '../requests';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';

export default function SellerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [hourlyViews, setHourlyViews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadAnalytics();
    loadHourlyViews();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerAnalytics();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  };

  const loadHourlyViews = async () => {
    try {
      const res = await fetchBestTimeToPost();
      setHourlyViews(res.data); // [{ hour: 14, count: 123 }, …]
    } catch (err) {
      console.error('Failed to load hourly views:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Loading analytics…</p>
      </div>
    );
  }

  // Find best hour
  const bestHourObj = hourlyViews.reduce(
    (best, curr) => (curr.count > (best?.count || 0) ? curr : best),
    null
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Seller Dashboard</h2>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center">
          <ClipboardIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Listings
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {data.listing_count}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center">
          <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              ${parseFloat(data.total_revenue)?.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center">
          <EyeIcon className="h-8 w-8 text-indigo-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Views
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {data.total_views}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center">
          <ChartBarIcon className="h-8 w-8 text-yellow-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pending Bids
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {data.pending_bids}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(data.views_by_category).map(([cat, views]) => (
            <div key={cat} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-sm uppercase text-gray-500 dark:text-gray-400">
                {cat.replace('_', ' ')}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {views} views / {data.bids_by_category[cat] || 0} bids / $
                {parseFloat(data.revenue_by_category[cat] || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Listing Metrics Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-3">Your Listings</h3>
        <table className="min-w-full whitespace-nowrap">
          <thead>
            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Views</th>
              <th className="px-3 py-2">Bids</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.listing_metrics.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  <Link
                    to={`/marketplace/${item.id}`}
                    className="hover:underline"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {item.views_count}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {item.bids_count}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  ${parseFloat(item.sold_price || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {item.status}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Best Time to Post */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Best Time to Post</h3>
        {bestHourObj ? (
          <p className="text-gray-900 dark:text-gray-100">
            Most views at{' '}
            <span className="font-bold">
              {bestHourObj.hour}:00 – {bestHourObj.hour + 1}:00
            </span>{' '}
            ({bestHourObj.count} views)
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No view data yet.
          </p>
        )}
      </div>
    </div>
  );
}
