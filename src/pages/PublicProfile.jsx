// src/pages/Profile.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  toggleFollow,
  fetchUserRatings,
  fetchMyBadges,
  fetchSellerAnalytics,
} from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import MarketplaceCard from '../pages/MarketplaceCard';
import FeedCard from '../components/FeedCard';
import ReviewCard from '../components/ReviewCard';
import { FaInstagram, FaTwitter, FaFacebook, FaGlobe } from 'react-icons/fa';
import { X } from 'lucide-react';
import BestTimeToPost from '../components/BestTimeToPost';
import PriceCompetitiveness from '../components/PriceCompetitiveness';

export default function Profile() {
  // 1) Grab the raw “:id” from the URL. Could be "42" or "alice", etc.
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth(); // may be null

  // 2) Decide “isOwner”:
  //    • If currentUser is null → false
  //    • If paramId is all digits → compare to currentUser.id
  //    • Otherwise (contains letters) → compare to currentUser.username
  const isOwner = useMemo(() => {
    if (!currentUser || !paramId) return false;
    if (/^\d+$/.test(paramId)) {
      return currentUser.id.toString() === paramId;
    } else {
      return currentUser.username === paramId;
    }
  }, [paramId, currentUser]);

  // ─── Shared State ─────────────────────────────────────────────────────────────
  const [info, setInfo] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Posts infinite–scroll
  const [posts, setPosts] = useState([]);
  const [nextPostUrl, setNextPostUrl] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const postObserver = useRef();

  // Listings
  const [listings, setListings] = useState([]);

  // Ratings & Reviews (public or owner)
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Saved items (owner only)
  const [saved, setSaved] = useState([]);

  // “Ratings I’ve Given” & “Incoming Reviews” (owner only)
  const [myRatings, setMyRatings] = useState([]);
  const [incomingReviews, setIncomingReviews] = useState([]);

  // Badges (owner only)
  const [badges, setBadges] = useState([]);

  // Seller analytics (owner only)
  const [analytics, setAnalytics] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('posts');
  const [showDetails, setShowDetails] = useState(false);

  // ─── 1) Load Profile Info, Posts, Listings ───────────────────────────────────
  //     **Do not** include showNotification in the deps array here
  useEffect(() => {
    // If paramId is missing or “NaN”, bail out immediately
    if (!paramId) {
      setInitialLoading(false);
      return;
    }

    let mounted = true;
    setInitialLoading(true);

    (async () => {
      try {
        // Choose endpoint:
        // • If I’m the owner, fetch from `/users/${currentUser.id}/`
        // • Otherwise, use `/user/public/${paramId}/`
        let userEndpoint;
        if (isOwner && currentUser) {
          userEndpoint = `users/${currentUser.id}/`;
        } else {
          userEndpoint = `user/public/${paramId}/`;
        }

        // Fetch user data, posts, listings in parallel
        const [uR, pR, lR] = await Promise.all([
          api.get(userEndpoint),
          api.get(`posts/?user=${paramId}`),
          api.get(`marketplace/?seller=${paramId}`),
        ]);

        if (!mounted) return;
        setInfo(uR.data);

        // Posts
        const postResults = Array.isArray(pR.data.results) ? pR.data.results : [];
        setPosts(postResults);
        setNextPostUrl(pR.data.next || null);

        // Listings
        const listingResults = Array.isArray(lR.data.results) ? lR.data.results : [];
        setListings(listingResults);

        // If I’m viewing my own profile, also fetch “saved” items:
        if (isOwner && currentUser) {
          const allListingsRes = await api.get('marketplace/');
          const allItems = Array.isArray(allListingsRes.data.results)
            ? allListingsRes.data.results
            : allListingsRes.data;
          setSaved(allItems.filter((i) => i.saved_by_user));
        }
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
  }, [paramId, isOwner, currentUser]);
  // Removed `showNotification` from dependencies to prevent constant re‐triggers

  // ─── 2) Lazy‐load public “Ratings” when tab=ratings (only if not owner) ─────────
  useEffect(() => {
    if (activeTab !== 'ratings' || !listings.length || isOwner || !paramId) return;
    let mounted = true;
    setLoadingRatings(true);

    api
      .get(`ratings/user/${paramId}/`)
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
  }, [activeTab, listings, paramId, isOwner]);

  // ─── 3) Lazy‐load public “Reviews” when tab=reviews (not owner, business only) ───
  useEffect(() => {
    if (activeTab !== 'reviews' || !info?.is_business || isOwner || !paramId) return;
    let mounted = true;
    setLoadingReviews(true);

    api
      .get(`reviews/?business=${paramId}`)
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
  }, [activeTab, info, paramId, isOwner]);

  // ─── 4) Infinite–scroll more posts ─────────────────────────────────────────────
  const loadMorePosts = useCallback(
    async () => {
      if (!nextPostUrl || loadingPosts) return;
      setLoadingPosts(true);
      try {
        const res = await api.get(nextPostUrl);
        const more = Array.isArray(res.data.results) ? res.data.results : [];
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
    },
    [nextPostUrl, loadingPosts]
  );

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

  // ─── 5) Follow / Unfollow ───────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!info?.id) return;
    try {
      const res = await toggleFollow(info.id);
      setInfo((i) => ({ ...i, is_following: res.status === 'followed' }));
      showNotification(res.status === 'followed' ? 'Followed!' : 'Unfollowed.', 'success');
    } catch {
      showNotification('Could not update follow status.', 'error');
    }
  };

  // ─── 6) Message user ───────────────────────────────────────────────────────────
  const handleMessage = () => {
    if (!info?.id) return;
    navigate(`/inbox?to=${info.username}`);
  };

  // ─── 7) “Ratings I’ve Given” (owner only) ─────────────────────────────────────
  useEffect(() => {
    if (!isOwner || activeTab !== 'ratings' || !currentUser) return;
    api
      .get(`ratings/user/${currentUser.id}/`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setMyRatings(data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load your ratings.', 'error');
      });
  }, [activeTab, isOwner, currentUser]);

  // ─── 8) “Incoming Reviews” (owner & business only) ────────────────────────────
  useEffect(() => {
    if (!isOwner || !currentUser || !currentUser.is_business || activeTab !== 'reviews')
      return;
    api
      .get(`reviews/?business=${currentUser.id}`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setIncomingReviews(data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load reviews.', 'error');
      });
  }, [activeTab, isOwner, currentUser]);

  // ─── 9) Badges (owner only) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOwner) return;
    fetchMyBadges()
      .then((res) => {
        const data = Array.isArray(res.data.results)
          ? res.data.results
          : Array.isArray(res.data)
          ? res.data
          : [];
        setBadges(data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load badges.', 'error');
      });
  }, [isOwner]);

  // ─── 10) Seller Analytics (owner & verified seller only) ──────────────────────
  useEffect(() => {{/*|| !currentUser.is_verified_seller*/}
    if (!isOwner || !currentUser ) return;
    fetchSellerAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load analytics.', 'error');
      });
  }, [isOwner, currentUser]);

  // ─── Compute XP/Level ──────────────────────────────────────────────────────────
  const xp = info?.xp_points ?? 0;
  const level = Math.floor(xp / 100);
  const progress = xp % 100;

  // ─── Build Tabs ───────────────────────────────────────────────────────────────
  const publicTabs = [
    'posts',
    'listings',
    ...(listings.length ? ['ratings'] : []),
    ...(info?.is_business ? ['reviews'] : []),
  ];
  const ownerTabs = [
    'posts',
    'listings',
    'saved',
    'ratings',
    'analytics',
    ...(currentUser?.is_business ? ['reviews'] : []),
  ];
  const tabs = isOwner ? ownerTabs : publicTabs;

  // ─── While still loading or if “info” never arrived ───────────────────────────
  if (initialLoading || !info) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading profile…
      </div>
    );
  }

  // ─── Detail Panel Content ─────────────────────────────────────────────────────
  const detailContent = (
    <div className="flex-1 overflow-y-auto">
{/*      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowDetails(false)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </button>
      </div> */}

      {/* Bio */}
      {info.bio && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Bio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{info.bio}</p>
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
            {info.social_links?.twitter && info.social_links.twitter.trim() !== '' && (
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

      {/* Badges (owner only) */}
      {isOwner && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Badges
          </h2>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No badges yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <li
                  key={b.badge_code}
                  className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded text-xs"
                >
                  {b.badge_display}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* XP Bar */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Progress
        </h2>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">
          Level {level} — {progress}% to next
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
        {isOwner ? (
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

  // ─── Final Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Back link */}
      <Link to="/" className="block text-sm text-blue-600 hover:underline">
        ← Back to Feed
      </Link>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
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
                {(info.display_name?.charAt(0) || info.username.charAt(0)).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name / Username / City */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {info.display_name || info.username}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              @{info.username}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              City: {info.city || 'Not specified'}
            </p>
          </div>

          {/* CTAs on large screens */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex gap-2">
              {isOwner ? (
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
            <button
              className="lg:hidden px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
              onClick={() => setShowDetails(true)}
            >
              Details
            </button>
          </div>
        </div>

        {/* Inline details on large screens */}
        <div className="hidden lg:flex flex-col gap-6 mt-6">{detailContent}</div>
      </div>

      {/* Mobile Bottom Sheet (≤ sm) */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" style={{margin: 0}}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"   style={{
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(4px)',
  }}
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
        <div className="fixed inset-0 z-50 hidden md:flex lg:hidden" style={{margin: 0}}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 "    style={{
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(4px)',
  }}
            onClick={() => setShowDetails(false)}
          />
          {/* Side Drawer */}
          <div className="relative ml-auto w-64 h-full bg-white dark:bg-gray-900 p-4 flex flex-col">
            {detailContent}
          </div>
        </div>
      )}

      {/* Tabs & Content */}
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
                  <div key={p.id} ref={i === posts.length - 1 ? lastPostRef : null}>
                    <FeedCard post={p} />
                  </div>
                ))}
                {loadingPosts && <p className="text-center text-gray-400">Loading more…</p>}
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

          {/* SAVED (owner only) */}
          {activeTab === 'saved' &&
            isOwner &&
            (saved.length === 0 ? (
              <p className="text-center text-gray-500">No saved items.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {saved.map((item) => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            ))}

          {/* RATINGS */}
          {activeTab === 'ratings' && (
            <>
              {isOwner ? (
                <div className="space-y-4">
                  {myRatings.length === 0 ? (
                    <p className="text-gray-500">You haven’t rated anyone yet.</p>
                  ) : (
                    myRatings.map((rating) => (
                      <ReviewCard
                        key={rating.id}
                        review={rating}
                        onReply={() =>
                          navigate(`/messages/thread/${rating.from_user.id}`)
                        }
                      />
                    ))
                  )}
                </div>
              ) : (
                <>
                  {loadingRatings ? (
                    <p className="text-center text-gray-400">Loading ratings…</p>
                  ) : ratings.length === 0 ? (
                    <p className="text-center text-gray-500">No ratings yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {ratings.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && info.is_business && (
            <>
              {isOwner ? (
                <div className="space-y-4">
                  {incomingReviews.length === 0 ? (
                    <p className="text-gray-500">No reviews for your business yet.</p>
                  ) : (
                    incomingReviews.map((rev) => (
                      <ReviewCard
                        key={rev.id}
                        review={rev}
                        onReply={() =>
                          navigate(`/messages/thread/${rev.from_user.id}`)
                        }
                      />
                    ))
                  )}
                </div>
              ) : (
                <>
                  {loadingReviews ? (
                    <p className="text-center text-gray-400">Loading reviews…</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-center text-gray-500">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Owner‐Only Analytics  && currentUser.is_verified_seller- add when it one day matters */}
      {isOwner && currentUser && analytics && activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
          <h3 className="font-semibold mb-3">Your Seller Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p>Total Listings</p>
              <p className="font-bold">{analytics.listing_count}</p>
            </div>
            <div>
              <p>Total Revenue</p>
              <p className="font-bold">${parseFloat(analytics.total_revenue)?.toFixed(2)}</p>
            </div>
            <div>
              <p>Pending Bids</p>
              <p className="font-bold">{analytics.pending_bids}</p>
            </div>
            <div>
              <p>Total Views</p>
              <p className="font-bold">{analytics.total_views}</p>
            </div>
          </div>
          <BestTimeToPost />
        </div>
      )}
    </div>
  );
}
