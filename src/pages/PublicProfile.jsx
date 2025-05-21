import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import MarketplaceCard from './MarketplaceCard';
import FeedCard from '../components/FeedCard';

// ------------------------------
// FUTURE: LEVELING SYSTEM PLAN
// ------------------------------
// Users have an `xp` field on the backend.
// Here's how you could define a leveling system:
//
// - XP thresholds per level could be linear or exponential.
//   e.g., Level 1: 0-99 XP, Level 2: 100-199 XP, etc.
//   or Level = floor(xp / 100)
// - Show progress bar: progress = xp % 100 (for current level)
// - Show level badge: Level 3 🔰, Level 10 🧠, etc.
// - Award XP for:
//     - Posting (5 XP)
//     - RSVP to event (5 XP)
//     - Creating an event (10 XP)
//     - Swapp trades (20 XP)
//     - Commenting or reacting (optional)
// - Display incentives: Custom badges, highlight color, feature unlocks
// ------------------------------

function PublicProfile() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);

  const [nextPostUrl, setNextPostUrl] = useState(null);
  const [nextListingUrl, setNextListingUrl] = useState(null);

  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const postObserver = useRef();
  const listingObserver = useRef();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        const [userRes, postRes, listingRes] = await Promise.all([
          api.get(`user/public/${id}/`),
          api.get(`posts/?user=${id}`),
          api.get(`marketplace/`),
        ]);

        const user = userRes.data;
        setInfo(user);
        setPosts(postRes.data?.results || []);
        setNextPostUrl(postRes.data?.next || null);

        const userListings = (listingRes.data?.results || []).filter(i => i.seller === user.id);
        setListings(userListings);
        // Listings may not be paginated per user, so we skip nextListingUrl
      } catch (error) {
        console.error('Error loading public profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const loadMorePosts = useCallback(async () => {
    if (!nextPostUrl || loadingPosts) return;
    try {
      setLoadingPosts(true);
      const res = await api.get(nextPostUrl);
      const newPosts = res.data?.results || [];
      const uniquePosts = newPosts.filter(p => !posts.some(existing => existing.id === p.id));
      setPosts(prev => [...prev, ...uniquePosts]);
      setNextPostUrl(res.data?.next || null);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [nextPostUrl, posts, loadingPosts]);

  const lastPostRef = useCallback(
    node => {
      if (loadingPosts || !nextPostUrl) return;
      if (postObserver.current) postObserver.current.disconnect();
      postObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) loadMorePosts();
      });
      if (node) postObserver.current.observe(node);
    },
    [loadMorePosts, loadingPosts, nextPostUrl]
  );

  if (initialLoading || !info) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading profile...
      </div>
    );
  }

  const level = Math.floor(info.xp / 100);
  const progress = info.xp % 100;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Back Link */}
      <Link to="/" className="text-blue-600 hover:underline text-sm">
        ← Back to Feed
      </Link>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={info.profile_image_url || '/default-avatar.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover shadow"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              @{info.username}
              {info.is_verified && <span className="text-blue-500 text-sm">✅ Verified</span>}
              {info.is_business && <span className="text-purple-500 text-sm">🏢 Business</span>}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">City: {info.city || 'N/A'}</p>
            {info.bio && <p className="text-sm text-gray-500 mt-1">{info.bio}</p>}
            {info.xp !== undefined && (
              <div className="mt-2 text-sm">
                Level {level} — {progress}% to next
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="flex gap-4 mb-4 border-b">
          {['posts', 'listings'].map(tab => (
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

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            {posts.length === 0 && !loadingPosts ? (
              <p className="text-gray-500">This user hasn't posted yet.</p>
            ) : (
              <>
                {posts.map((p, idx) => (
                  <div key={p.id} ref={idx === posts.length - 1 ? lastPostRef : null}>
                    <FeedCard post={p} />
                  </div>
                ))}
                {loadingPosts && <p className="text-sm text-gray-400 text-center">Loading more posts...</p>}
              </>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <p className="text-gray-500">No marketplace listings yet.</p>
            ) : (
              listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;
