// src/pages/PublicProfile.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { toggleFollow } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import MarketplaceCard from './MarketplaceCard';
import FeedCard from '../components/FeedCard';
import ReviewCard from '../components/ReviewCard';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { showNotification } = useNotification();

  const [info, setInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  // posts infinite‐scroll
  const [posts, setPosts] = useState([]);
  const [nextPostUrl, setNextPostUrl] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const postObserver = useRef();

  // listings, ratings, reviews
  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  // 1️⃣ Fetch user, posts, *their* listings
  useEffect(() => {
    let mounted = true;
    setInitialLoading(true);

    (async () => {
      try {
        const [uR, pR, lR] = await Promise.all([
          api.get(`user/public/${id}/`),
          api.get(`posts/?user=${id}`),
          api.get(`marketplace/?seller=${id}`),  // only this user’s items
        ]);
        if (!mounted) return;

        setInfo(uR.data);
        setPosts(pR.data.results || []);
        setNextPostUrl(pR.data.next  || null);
        setListings(lR.data.results || []);
      } catch (err) {
        console.error(err);
        showNotification('Failed to load profile.', 'error');
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  // 2️⃣ Lazy load ratings if they have listings and selected “Ratings”
  useEffect(() => {
    if (activeTab !== 'ratings' || listings.length === 0) return;
    let mounted = true;
    setLoadingRatings(true);

    api.get(`ratings/user/${id}/`)
      .then(res => {
        if (!mounted) return;
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : [];
        setRatings(data);
      })
      .catch(err => {
        console.error(err);
        showNotification('Failed to load ratings.', 'error');
      })
      .finally(() => { if (mounted) setLoadingRatings(false); });

    return () => { mounted = false; };
  }, [activeTab, listings, id]);

  // 3️⃣ Lazy load reviews if business & selected “Reviews”
  useEffect(() => {
    if (activeTab !== 'reviews' || !info?.is_business) return;
    let mounted = true;
    setLoadingReviews(true);

    api.get(`reviews/?business=${id}`)
      .then(res => {
        if (!mounted) return;
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : [];
        setReviews(data);
      })
      .catch(err => {
        console.error(err);
        showNotification('Failed to load reviews.', 'error');
      })
      .finally(() => { if (mounted) setLoadingReviews(false); });

    return () => { mounted = false; };
  }, [activeTab, info, id]);

  // 4️⃣ Infinite–scroll more posts
  const loadMorePosts = useCallback(async () => {
    if (!nextPostUrl || loadingPosts) return;
    setLoadingPosts(true);
    try {
      const res = await api.get(nextPostUrl);
      const more = res.data.results || [];
      setPosts(prev => {
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...more.filter(p => !seen.has(p.id))];
      });
      setNextPostUrl(res.data.next || null);
    } catch {
      // ignore
    } finally {
      setLoadingPosts(false);
    }
  }, [nextPostUrl, loadingPosts]);

  const lastPostRef = useCallback(node => {
    if (loadingPosts || !nextPostUrl) return;
    postObserver.current?.disconnect();
    postObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMorePosts();
    });
    if (node) postObserver.current.observe(node);
  }, [loadMorePosts, loadingPosts, nextPostUrl]);

  // 5️⃣ Follow / Unfollow
  const handleFollow = async () => {
    try {
      const res = await toggleFollow(info.id);
      setInfo(i => ({ ...i, is_following: res.status === 'followed' }));
      showNotification(
        res.status === 'followed' ? 'Followed!' : 'Unfollowed.',
        'success'
      );
    } catch {
      showNotification('Could not update follow status.', 'error');
    }
  };

  // 6️⃣ Message any user
  const handleMessage = () => navigate(`/messages/thread/${info.id}`);

  if (initialLoading || !info) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading profile…
      </div>
    );
  }

  const xp       = info.xp_points ?? 0;
  const level    = Math.floor(xp / 100);
  const progress = xp % 100;

  // Build tabs dynamically
  const tabs = [
    'posts',
    'listings',
    ...(listings.length   ? ['ratings'] : []),
    ...(info.is_business ? ['reviews'] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to Feed
      </Link>

      {/* — Profile Header — */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
        <img
          src={info.profile_image_url || '/default-avatar.png'}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover shadow"
        />

        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">@{info.username}</h1>
            {info.is_verified && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                Verified
              </span>
            )}
            {info.is_business && (
              <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded">
                Business
              </span>
            )}
          </div>

          {info.city && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              City: {info.city}
            </p>
          )}
          {info.bio && (
            <p className="text-sm text-gray-500">{info.bio}</p>
          )}

          <div className="mt-4 w-full max-w-xs">
            <p className="text-sm font-medium">
              Level {level} — {progress}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded mt-1">
              <div
                className="h-2 bg-blue-600 rounded transition-all"
                style={{ width: `${Math.min(progress,100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          {me?.id === info.id ? (
            <Link
              to="/settings/profile"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit Profile
            </Link>
          ) : (
            <>
              <button
                onClick={handleFollow}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {info.is_following ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={handleMessage}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* — Tabs — */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="flex">
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

        <div className="p-6 space-y-6">
          {/* POSTS */}
          {activeTab === 'posts' && (
            posts.length === 0 && !loadingPosts ? (
              <p className="text-center text-gray-500">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((p,i) => (
                  <div key={p.id} ref={i === posts.length - 1 ? lastPostRef : null}>
                    <FeedCard post={p} />
                  </div>
                ))}
                {loadingPosts && (
                  <p className="text-center text-gray-400">Loading more…</p>
                )}
              </div>
            )
          )}

          {/* LISTINGS */}
          {activeTab === 'listings' && (
            listings.length === 0 ? (
              <p className="text-center text-gray-500">No listings yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {listings.map(item => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            )
          )}

          {/* RATINGS */}
          {activeTab === 'ratings' && (
            loadingRatings ? (
              <p className="text-center text-gray-400">Loading ratings…</p>
            ) : ratings.length === 0 ? (
              <p className="text-center text-gray-500">No ratings yet.</p>
            ) : (
              <div className="space-y-4">
                {ratings.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && info.is_business && (
            loadingReviews ? (
              <p className="text-center text-gray-400">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
