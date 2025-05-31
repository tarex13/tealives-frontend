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
import { FaInstagram, FaTwitter, FaFacebook, FaGlobe } from 'react-icons/fa';
import { X } from 'lucide-react';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { showNotification } = useNotification();

  const [info, setInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showDetails, setShowDetails] = useState(false);

  // posts infinite–scroll
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
          api.get(`marketplace/?seller=${id}`),
        ]);
        if (!mounted) return;

        setInfo(uR.data);
        setPosts(pR.data.results || []);
        setNextPostUrl(pR.data.next || null);
        setListings(lR.data.results || []);
      } catch (err) {
        console.error(err);
        showNotification('Failed to load profile.', 'error');
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, showNotification]);

  // 2️⃣ Lazy load ratings if they have listings and selected “Ratings”
  useEffect(() => {
    if (activeTab !== 'ratings' || listings.length === 0) return;
    let mounted = true;
    setLoadingRatings(true);

    api
      .get(`ratings/user/${id}/`)
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setRatings(data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load ratings.', 'error');
      })
      .finally(() => {
        if (mounted) setLoadingRatings(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, listings, id, showNotification]);

  // 3️⃣ Lazy load reviews if business & selected “Reviews”
  useEffect(() => {
    if (activeTab !== 'reviews' || !info?.is_business) return;
    let mounted = true;
    setLoadingReviews(true);

    api
      .get(`reviews/?business=${id}`)
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setReviews(data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load reviews.', 'error');
      })
      .finally(() => {
        if (mounted) setLoadingReviews(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, info, id, showNotification]);

  // 4️⃣ Infinite–scroll more posts
  const loadMorePosts = useCallback(async () => {
    if (!nextPostUrl || loadingPosts) return;
    setLoadingPosts(true);
    try {
      const res = await api.get(nextPostUrl);
      const more = res.data.results || [];
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...more.filter((p) => !seen.has(p.id))];
      });
      setNextPostUrl(res.data.next || null);
    } catch {
      // ignore
    } finally {
      setLoadingPosts(false);
    }
  }, [nextPostUrl, loadingPosts]);

  const lastPostRef = useCallback(
    (node) => {
      if (loadingPosts || !nextPostUrl) return;
      postObserver.current?.disconnect();
      postObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMorePosts();
      });
      if (node) postObserver.current.observe(node);
    },
    [loadMorePosts, loadingPosts, nextPostUrl]
  );

  // 5️⃣ Follow / Unfollow
  const handleFollow = async () => {
    try {
      const res = await toggleFollow(info.id);
      setInfo((i) => ({ ...i, is_following: res.status === 'followed' }));
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

  const xp = info.xp_points ?? 0;
  const level = Math.floor(xp / 100);
  const progress = xp % 100;

  // Build tabs dynamically
  const tabs = [
    'posts',
    'listings',
    ...(listings.length ? ['ratings'] : []),
    ...(info.is_business ? ['reviews'] : []),
  ];

  // Detail‐panel content (used in both mobile bottom sheet and medium side drawer)
  const detailContent = (
    <div className="flex-1 overflow-y-auto">
      {/* Close button (top‐right) */}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowDetails(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </button>
      </div>

      {/* Bio */}
      {info.bio && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Bio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {info.bio}
          </p>
        </div>
      )}

      {/* Social Icons */}
      {(info.social_links?.website ||
        info.social_links?.instagram ||
        (info.social_links?.twitter && info.social_links.twitter.trim() !== '') ||
        info.social_links?.facebook) && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Social
          </h2>
          <div className="flex items-center gap-4">
            {info.social_links?.website && (
              <a
                href={info.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xl hover:opacity-80"
              >
                <FaGlobe />
              </a>
            )}
            {info.social_links?.instagram && (
              <a
                href={info.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 text-xl hover:opacity-80"
              >
                <FaInstagram />
              </a>
            )}
            {info.social_links?.twitter &&
              info.social_links.twitter.trim() !== '' && (
                <a
                  href={info.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xl hover:opacity-80"
                >
                  <FaTwitter />
                </a>
              )}
            {info.social_links?.facebook && (
              <a
                href={info.social_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 text-xl hover:opacity-80"
              >
                <FaFacebook />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Badges
        </h2>
        <div className="flex items-center gap-2">
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
          {!info.is_verified && !info.is_business && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No badges
            </p>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Progress
        </h2>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">
          Level {level} — {progress}%
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded">
          <div
            className="h-2 bg-blue-600 rounded transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {me?.id === info.id ? (
          <Link
            to="/settings/profile"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
          >
            Edit Profile
          </Link>
        ) : (
          <>
            <button
              onClick={handleFollow}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
            >
              {info.is_following ? 'Unfollow' : 'Follow'}
            </button>
            <button
              onClick={handleMessage}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
            >
              Message
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 sm:px-6 lg:max-w-5xl lg:px-8">
      <Link
        to="/"
        className="block text-sm text-blue-600 hover:underline mb-4 sm:mb-6"
      >
        ← Back to Feed
      </Link>

      {/* — Profile Card — */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        {/* Top row: Avatar + name/username/city + Details or CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center flex-shrink-0">
            {info.profile_image_url ? (
              <img
                src={info.profile_image_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-bold">
                {(
                  info.display_name?.charAt(0) ||
                  info.username.charAt(0)
                ).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name / Username / City */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {info.display_name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              @{info.username}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              City: {info.city || 'Not specified'}
            </p>
          </div>

          {/* Details button on small/medium, CTAs on large */}
          <div className="flex items-center gap-2">
            {/* Large screens: show CTAs inline */}
            <div className="hidden lg:flex gap-2">
              {me?.id === info.id ? (
                <Link
                  to="/settings/profile"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                  >
                    {info.is_following ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                  >
                    Message
                  </button>
                </>
              )}
            </div>

            {/* Small + Medium: show “Details” */}
            <button
              className="lg:hidden px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
              onClick={() => setShowDetails(true)}
            >
              Details
            </button>
          </div>
        </div>

        {/* Inline details on large screens */}
        <div className="hidden lg:flex flex-col gap-6 mt-6">
          {/* Bio */}
          {info.bio && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Bio
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {info.bio}
              </p>
            </div>
          )}

          {/* Social Icons */}
          {(info.social_links?.website ||
            info.social_links?.instagram ||
            (info.social_links?.twitter && info.social_links.twitter.trim() !== '') ||
            info.social_links?.facebook) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Social
              </h2>
              <div className="flex items-center gap-4">
                {info.social_links?.website && (
                  <a
                    href={info.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xl hover:opacity-80"
                  >
                    <FaGlobe />
                  </a>
                )}
                {info.social_links?.instagram && (
                  <a
                    href={info.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 text-xl hover:opacity-80"
                  >
                    <FaInstagram />
                  </a>
                )}
                {info.social_links?.twitter &&
                  info.social_links.twitter.trim() !== '' && (
                    <a
                      href={info.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xl hover:opacity-80"
                    >
                      <FaTwitter />
                    </a>
                  )}
                {info.social_links?.facebook && (
                  <a
                    href={info.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 text-xl hover:opacity-80"
                  >
                    <FaFacebook />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Badges */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Badges
            </h2>
            <div className="flex items-center gap-2">
              {info.is_verified && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                  Verified
                </span>
              )}
              {info.is_business && (
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-sm rounded">
                  Business
                </span>
              )}
              {!info.is_verified && !info.is_business && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No badges
                </p>
              )}
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Progress
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Level {level} — {progress}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded">
              <div
                className="h-2 bg-blue-600 rounded transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet (≤ sm) */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowDetails(false)}
          />

          {/* Panel */}
          <div className="relative w-full h-2/3 bg-white dark:bg-gray-900 rounded-t-2xl p-4 flex flex-col">
            {detailContent}
          </div>
        </div>
      )}

      {/* Medium Side Drawer (≥ sm & < lg) */}
      {showDetails && (
        <div className="fixed inset-0 z-50 hidden md:flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowDetails(false)}
          />

          {/* Side Drawer */}
          <div className="relative ml-auto w-64 h-full bg-white dark:bg-gray-900 p-4 flex flex-col">
            {detailContent}
          </div>
        </div>
      )}

      {/* — Tabs & Content — */}
      <div className="rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto bg-white dark:bg-gray-900 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-shrink-0
                px-4 py-3 text-center font-medium
                ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-700'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="py-6 space-y-6">
          {/* POSTS */}
          {activeTab === 'posts' &&
            (posts.length === 0 && !loadingPosts ? (
              <p className="text-center text-gray-500">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((p, i) => (
                  <div
                    key={p.id}
                    ref={i === posts.length - 1 ? lastPostRef : null}
                  >
                    <FeedCard post={p} />
                  </div>
                ))}
                {loadingPosts && (
                  <p className="text-center text-gray-400">Loading more…</p>
                )}
              </div>
            ))}

          {/* LISTINGS */}
          {activeTab === 'listings' &&
            (listings.length === 0 ? (
              <p className="text-center text-gray-500">No listings yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            ))}

          {/* RATINGS */}
          {activeTab === 'ratings' &&
            (loadingRatings ? (
              <p className="text-center text-gray-400">Loading ratings…</p>
            ) : ratings.length === 0 ? (
              <p className="text-center text-gray-500">No ratings yet.</p>
            ) : (
              <div className="space-y-4">
                {ratings.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ))}

          {/* REVIEWS */}
          {activeTab === 'reviews' &&
            info.is_business &&
            (loadingReviews ? (
              <p className="text-center text-gray-400">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
