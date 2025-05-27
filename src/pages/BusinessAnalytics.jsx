// src/pages/BusinessAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { fetchBusinessAnalytics } from '../requests';

export default function BusinessAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchBusinessAnalytics()
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <p>Loading analytics…</p>;

  // helper for currency
  const fmt = num => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(num);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Engagement */}
        <StatCard title="Profile Views" value={stats.profile_views} />
        <StatCard title="Followers" value={stats.follower_count} />
        <StatCard title="Your Posts" value={stats.post_count} />

        {/* Events */}
        <StatCard title="Events Hosted" value={stats.event_count} />
        <StatCard title="Total RSVPs" value={stats.event_rsvps} />
        <StatCard title="Avg. RSVPs/Event" value={stats.avg_rsvps_per_event} />

        {/* Messaging */}
        <StatCard title="Messages Received" value={stats.message_interactions} />

        {/* Marketplace */}
        <StatCard title="Listings" value={stats.listing_count} />
        <StatCard title="Sold Items" value={stats.sold_count} />
        <StatCard title="Total Revenue" value={fmt(stats.total_revenue)} />
        <StatCard title="Pending Bids" value={stats.pending_bids} />
        <StatCard title="Avg. Bid Amount" value={fmt(stats.avg_bid_amount)} />

        {/* Reviews */}
        <StatCard 
          title="Reviews" 
          value={`${stats.review_count} • Avg. ${stats.average_rating}★`} 
          className="col-span-full"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, className = '' }) {
  return (
    <div
      className={
        `bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center ` +
        className
      }
    >
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
