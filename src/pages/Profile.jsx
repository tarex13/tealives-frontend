// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePaginatedPosts } from '../hooks/usePaginatedPosts';
import api from '../api';
import MarketplaceCard from './MarketplaceCard';
import FeedCard from '../components/FeedCard';
import ReviewCard from '../components/ReviewCard';
import { useNotification } from '../context/NotificationContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [listings, setListings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [incomingReviews, setIncomingReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');

  const { posts, loading, hasMore, sentinelRef } = usePaginatedPosts(user?.id);

  // 🔄 Fetch listings & saved
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await api.get('marketplace/');
        const items = Array.isArray(res.data.results) ? res.data.results : res.data;
        setListings(items.filter(i => i.seller === user.id));
        setSaved(items.filter(i => i.saved_by_user));
      } catch (err) {
        console.error(err);
        showNotification('Failed to load listings.', 'error');
      }
    })();
  }, [user]);

  // 🔄 Fetch your own ratings (ensure array)
  useEffect(() => {
    if (activeTab !== 'ratings') return;
    api.get(`ratings/user/${user.id}/`)
      .then(res => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : [];
        setMyRatings(data);
      })
      .catch(err => {
        console.error(err);
        showNotification('Failed to load your ratings.', 'error');
      });
  }, [activeTab, user]);

  // 🔄 Fetch incoming business reviews
  useEffect(() => {
    if (!user.is_business || activeTab !== 'reviews') return;
    api.get(`reviews/?business=${user.id}`)
      .then(res => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : [];
        setIncomingReviews(data);
      })
      .catch(err => {
        console.error(err);
        showNotification('Failed to load reviews.', 'error');
      });
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading profile...
      </div>
    );
  }

  // XP / Level
  const xp       = user.xp_points ?? 0;
  const level    = Math.floor(xp / 100);
  const progress = xp % 100;

  // Quick stats
  const stats = [
    { label: 'Posts',    value: posts.length },
    { label: 'Listings', value: listings.length },
    { label: 'Saved',    value: saved.length },
  ];

  const tabs = [
    'posts',
    'listings',
    'saved',
    'ratings',
    ...(user.is_business ? ['reviews'] : []),
  ];

  const handleReply = authorId => {
    navigate(`/messages/thread/${authorId}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* — Profile Header — */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
        <img
          src={user.profile_image_url || '/default-avatar.png'}
          alt="Avatar"
          className="w-28 h-28 rounded-full object-cover shadow"
        />
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">@{user.username}</h1>
          {user.email && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {user.email}
            </p>
          )}
          {user.city && (
            <p className="text-sm text-gray-500">City: {user.city}</p>
          )}
          {user.bio && (
            <p className="text-sm text-gray-500">{user.bio}</p>
          )}

          <div className="mt-4">
            <p className="text-sm font-medium">
              Level {level} — {progress}% to next
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded mt-1">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <Link
          to="/settings/profile"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Edit Profile
        </Link>
      </div>

      {/* — Business Details — */}
      {user.is_business && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Business Details</h2>
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {(user.logo || user.profile_image_url) && (
              <img
                src={user.logo || user.profile_image_url}
                alt="Business Logo"
                className="w-24 h-24 object-cover rounded shadow mb-4 md:mb-0"
              />
            )}
            <div className="space-y-2 text-sm">
              {user.business_name && (
                <p><strong>Name:</strong> {user.business_name}</p>
              )}
              {user.business_type && (
                <p><strong>Type:</strong> {user.business_type}</p>
              )}
              {user.business_description && (
                <p><strong>Description:</strong> {user.business_description}</p>
              )}
              {user.business_hours && Object.keys(user.business_hours).length > 0 && (
                <div>
                  <strong>Hours:</strong>
                  <ul className="list-disc list-inside">
                    {Object.entries(user.business_hours).map(
                      ([day, hrs]) => (
                        <li key={day}>{day}: {hrs}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
              {user.business_locations?.length > 0 && (
                <p><strong>Locations:</strong> {user.business_locations.join(', ')}</p>
              )}
              {user.contact_email && (
                <p><strong>Contact:</strong> {user.contact_email}</p>
              )}
              {user.website && (
                <p>
                  <strong>Website:</strong>{' '}
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* — Quick Stats — */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow text-center"
          >
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-gray-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* — Tabs — */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400'
              } hover:text-blue-700`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* — Tab Content — */}
      <div className="space-y-6">
        {activeTab === 'posts' && (
          posts.length === 0 && !loading ? (
            <p className="text-center text-gray-500">No posts yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map(p => <FeedCard key={p.id} post={p} />)}
              {loading && <p className="text-center text-gray-400">Loading…</p>}
              {hasMore && <div ref={sentinelRef} className="h-1" />}
            </div>
          )
        )}

        {activeTab === 'listings' && (
          listings.length === 0 ? (
            <p className="text-center text-gray-500">No listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {listings.map(item => <MarketplaceCard key={item.id} item={item} />)}
            </div>
          )
        )}

        {activeTab === 'saved' && (
          saved.length === 0 ? (
            <p className="text-center text-gray-500">No saved items.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {saved.map(item => <MarketplaceCard key={item.id} item={item} />)}
            </div>
          )
        )}

        {activeTab === 'ratings' && (
          loading ? (
            <p className="text-center text-gray-400">Loading ratings…</p>
          ) : myRatings.length === 0 ? (
            <p className="text-center text-gray-500">No ratings yet.</p>
          ) : (
            <div className="space-y-4">
              {myRatings.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )
        )}

        {activeTab === 'reviews' && user.is_business && (
          incomingReviews.length === 0 ? (
            <p className="text-center text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {incomingReviews.map(r => (
                <div key={r.id} className="space-y-2">
                  <ReviewCard review={r} />
                  <button
                    onClick={() => handleReply(r.author_id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Reply to {r.author}
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
