import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePaginatedPosts } from '../hooks/usePaginatedPosts';
import api from '../api';
import MarketplaceCard from './MarketplaceCard';
import FeedCard from '../components/FeedCard';

function Profile() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const { posts, loading, hasMore, sentinelRef } = usePaginatedPosts(user?.id);

  useEffect(() => {
    if (!user?.id) return;

    const loadListings = async () => {
      try {
        const res = await api.get('marketplace/');
        const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
        setListings(data.filter((i) => i.seller === user.id));
        setSaved(data.filter((i) => i.saved_by_user));
      } catch (err) {
        console.error('Failed to load listings:', err);
      }
    };

    loadListings();
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const level = Math.floor(user.xp / 100);
  const progress = user.xp % 100;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user.profile_image_url || '/default-avatar.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover shadow"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              @{user.username}
              {user.is_verified && <span className="text-blue-500 text-sm">✅ Verified</span>}
              {user.is_business && <span className="text-purple-500 text-sm">🏢 Business</span>}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
            <p className="text-sm text-gray-500">City: {user.city || 'N/A'}</p>
            <p className="text-sm text-gray-500 mt-1">Bio: {user.bio || 'No bio set'}</p>

            <div className="mt-2 text-sm">
              Level {level} — {progress}% to next
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <Link
          to="/settings/profile"
          className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-lg font-semibold">{posts.length}</p>
          <p className="text-gray-500 text-sm">Posts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-lg font-semibold">{listings.length}</p>
          <p className="text-gray-500 text-sm">Listings</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-lg font-semibold">{saved.length}</p>
          <p className="text-gray-500 text-sm">Saved</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:underline"
          >
            🔄 Refresh Feed
          </button>
        </div>
      </div>

      <div className="mt-6 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex gap-4 mb-4 border-b">
          {['posts', 'listings', 'saved'].map((tab) => (
            <button
              key={tab}
              className={`pb-2 px-1 border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              } hover:text-blue-700`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 && !loading ? (
            <p className="text-gray-500">You haven't posted yet.</p>
          ) : (
            <>
              {posts.map((p) => (
                <div key={p.id}>
                  <FeedCard post={p} />
                </div>
              ))}
              {loading && (
                <div className="text-sm text-center text-gray-400 py-4">Loading more...</div>
              )}
              {hasMore && <div ref={sentinelRef} className="h-1" />}
            </>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <p className="text-gray-500">No marketplace listings yet.</p>
          ) : (
            listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <p className="text-gray-500">No saved listings yet.</p>
          ) : (
            saved.map((item) => <MarketplaceCard key={item.id} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
