// src/pages/Profile.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  toggleFollow,
  fetchUserRatings,
  createReview,
  fetchUserBadges,
  fetchSellerAnalytics,
} from '../requests';
import { useNotification } from '../context/NotificationContext';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import MarketplaceCard from '../pages/MarketplaceCard';
import FeedCard from '../components/FeedCard';
import ReviewCard from '../components/ReviewCard';
import { FaInstagram, FaTwitter, FaFacebook, FaGlobe, FaClock } from 'react-icons/fa';
import { X } from 'lucide-react';
import BestTimeToPost from '../components/BestTimeToPost';
import PriceCompetitiveness from '../components/PriceCompetitiveness';

export default function Profile() {
  // 1) Grab the raw “:username” from the URL. 
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth(); // may be null
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
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
  const [loadingBadges, setLoadingBadges] = useState(false);

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

  // ─── 9) Badges (public & owner) ───────────────────────────────────────────────
  useEffect(() => {
    // only fetch when the Badges tab is active
   if (activeTab !== 'badges') return;
    setLoadingBadges(true);
    fetchUserBadges(paramId)
      .then((res) => {
        // API returns { user, user_badges: [...], seller_badges: [...] }
        const userList = Array.isArray(res.data.user_badges)
          ? res.data.user_badges
          : [];
        const sellerList = Array.isArray(res.data.seller_badges)
          ? res.data.seller_badges
          : [];
        // If you want them separately:
        // setUserBadges(userList);
        // setSellerBadges(sellerList);
        // But here we just combine for the single grid:
        setBadges([...userList, ...sellerList]);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load badges.', 'error');
      })
      .finally(() => {
        setLoadingBadges(false);
      });
  }, [activeTab, paramId]);

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



  // ─── Submit a new review ──────────────────────────────────────────
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
   if (!newRating) {
      showNotification('Please select a rating.', 'warning');
      return;
    }
    try {
      await createReview({
        business: info.id,
        rating: newRating,
        comment: newComment.trim(),
      });
     showNotification('Review submitted!', 'success');
      setNewRating(0);
      setNewComment('');
      // refresh list
      setLoadingReviews(true);
      const res = await api.get(`reviews/?business=${paramId}`);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
       ? res.data.results
        : [];
      setReviews(data);
    } catch (err) {
      console.error(err);
      showNotification('Failed to submit review.', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };  


  // ─── Compute XP/Level ──────────────────────────────────────────────────────────
  const xp = info?.xp_points ?? 0;
  const onexp = 100;
  const level = Math.floor(xp / onexp);
  const progress = xp % onexp;

  // ─── Build Tabs ───────────────────────────────────────────────────────────────
  const publicTabs = [
    'posts',
    'listings',
    ...(listings.length ? ['ratings'] : []),
    ...(info?.is_business ? ['reviews'] : []),
    'badges',
  ];
  const ownerTabs = [
    'posts',
    'listings',
    'saved',
    'ratings',
    ...(currentUser?.is_business ? ['reviews'] : []),
    'badges',
    'analytics',
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
const avgReview   = info.average_review;
const reviewCount = info.review_count;


// ─── Detail Panel Content ─────────────────────────────────────────────────────
const detailContent = (
  <div className="flex-1 overflow-y-auto space-y-6 p-2">
    {/* Close button (optional for medium screens) */}
    <div className="flex justify-end lg:hidden mb-2">
      <button
        onClick={() => setShowDetails(false)}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
      </button>
    </div>

    {/* Bio */}
    {info.bio && (
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Bio
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{info.bio}</p>
      </section>
    )}


    {/* Social Links */}
    {(info.social_links?.website ||
      info.social_links?.instagram ||
      info.social_links?.twitter ||
      info.social_links?.facebook) && (
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Social
        </h2>
        <div className="flex items-center gap-4">
          {info.social_links.website && (
            <a href={info.social_links.website} target="_blank" rel="noopener noreferrer" className="text-xl hover:opacity-80">
              <FaGlobe className="text-blue-600 dark:text-blue-400" />
            </a>
          )}
          {info.social_links.instagram && (
            <a href={info.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-xl hover:opacity-80">
              <FaInstagram className="text-pink-500 dark:text-pink-400" />
            </a>
          )}
          {info.social_links.twitter && (
            <a href={info.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-xl hover:opacity-80">
              <FaTwitter className="text-blue-400 dark:text-blue-300" />
            </a>
          )}
          {info.social_links.facebook && (
            <a href={info.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-xl hover:opacity-80">
              <FaFacebook className="text-blue-800 dark:text-blue-600" />
            </a>
          )}
        </div>
      </section>
    )}

    {/* Reviews (from Review model) */}
{avgReview != null && (
  <section className="mb-6">
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
      Reviews
    </h3>
    <div className="flex items-center space-x-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={`
            text-xl
            ${i < Math.round(avgReview) 
               ? 'text-yellow-400' 
               : 'text-gray-300 dark:text-gray-600'}
          `}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
        {avgReview} ({reviewCount})
      </span>
    </div>
  </section>
)}

    {/* XP / Level */}
    <section>
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
        Progress ({onexp}xp = 1 Level)
      </h2>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-700 dark:text-gray-300">Level {level}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded">
        <div
          className="h-2 bg-blue-600 rounded transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>

    {/* Business Details */}
    {info.is_business && (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Business Details
        </h2>
        {info.business_name && <p className="text-sm text-gray-600 dark:text-gray-400">Name: {info.business_name}</p>}
        {info.business_description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{info.business_description}</p>
        )}
        {info.website && (
          <a href={info.website} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline">
            Visit Website
          </a>
        )}
        {info.contact_email && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Email: {info.contact_email}</p>
        )}
        {info.contact_phone && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {info.contact_phone}</p>
        )}
        {info.business_hours && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Business Hours
            </h3>
            <div className="overflow-x-auto">
              <div className="inline-grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[300px]">
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                  .filter(day => info.business_hours[day])
                  .map(day => (
                    <div
                      key={day}
                      className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow"
                    >
                      <FaClock className="mr-3 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {day}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {info.business_hours[day]}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {info.business_locations?.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Locations</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              {info.business_locations.map((loc, i) => (
                <li key={i}>{loc}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )}

    {/* Action Buttons on small */}
    <div className="flex flex-col sm:flex-row gap-2 lg:hidden">
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
        <Helmet>
          <title>@{paramId} on Tealives</title>
        </Helmet>

        {/* Back link */}
        <Link to="/" className="block text-sm text-blue-600 hover:underline">
          ← Back to Feed
        </Link>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {info.profile_image_url ? (
                <img
                  loading="lazy"
                  src={info.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-3xl font-bold">
                  {(info.display_name?.[0] || info.username[0]).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name / Username / City / Verified */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {info.display_name ? info.display_name.charAt(0).toUpperCase() + info.display_name.slice(1) : info.username}
                </h1>
                {info.is_business && info.verified_business && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                @{info.username}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {info.city ? `City: ${info.city}` : 'City not specified'}
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
                onClick={() => setShowDetails(true)}
                className="lg:hidden px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
              >
                Details
              </button>
            </div>
          </div>

          {/* Inline details on large */}
          <div className="hidden lg:flex flex-col gap-6 mt-6">
            {detailContent}
          </div>
        </div>

        {/* Mobile Bottom Sheet (≤ sm) */}
        {showDetails && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{
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

        {/* Medium Side Drawer (sm < width < lg) */}
        {showDetails && (
          <div className="fixed inset-0 z-50 hidden md:flex lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{
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
                px-4 py-3 text-center font-medium cursor-pointer
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
                    <p className="text-gray-500 text-center">You haven’t been rated by anyone yet.</p>
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

          {activeTab === 'reviews' && info.is_business && (
            <>
              {/* ─── If I own this business, show incoming reviews ─────── */}
              {isOwner ? (
                <div className="space-y-4">
                  {incomingReviews.length === 0 ? (
                    <p className="text-gray-500 text-center">No reviews for your business yet.</p>
                  ) : (
                    incomingReviews.map((rev) => (
                      <ReviewCard key={rev.id} review={rev} />
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* ─── Review submission form ───────────────────────── */}
                  <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Leave a Review
                    </h3>
                    <div className="flex items-center mb-3">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`text-2xl mr-1 transition-colors ${
                            newRating >= star
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows="3"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      placeholder="Write your review..."
                    />
                    <button
                      onClick={handleReviewSubmit}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                    >
                      Submit Review
                    </button>
                  </div>

                  {/* ─── Existing public reviews ───────────────────────── */}
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
          
              {/* BADGES */}
              {activeTab === 'badges' && (
                <>
                  {loadingBadges ? (
                    <p className="text-center text-gray-400">Loading badges…</p>
                  ) : badges.length === 0 ? (
                    <p className="text-center text-gray-500">No badges yet.</p>
                  ) : (
                    // small‐screen scroll + horizontal padding
                    <div className="overflow-x-auto px-4 sm:px-0">
                      <ul className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {badges.map((b) => (
                          <li
                            key={b.id}
                            className="
                              flex-shrink-0
                              w-32 sm:w-36 md:w-40
                              flex flex-col items-center
                              p-4 sm:p-6
                              bg-white/20 dark:bg-gray-900/20
                              backdrop-blur-md
                              rounded-xl
                              ring-1 ring-white/10
                              transform transition
                              hover:scale-105 hover:shadow-xl shadow-lg
                            "
                          >
                            <div
                              className="
                                flex-shrink-0
                                w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
                                mb-4
                                flex items-center justify-center
                              "
                            >
                              {b.badge.icon_url ? (
                                <img
                                  loading="lazy"
                                  src={b.badge.icon_url}
                                  alt={b.badge.code}
                                  className="object-contain max-w-full max-h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                                  🏅
                                </div>
                              )}
                            </div>
                            <span className="mt-2 text-center text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                              {b.badge.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
