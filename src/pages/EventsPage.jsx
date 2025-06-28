// src/pages/EventsPage.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import EventActionMenu from '../components/EventActionMenu';
import { useNotification } from '../context/NotificationContext';

import {
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { toggleRSVP, notInterestedEvent } from '../requests';

const TAG_OPTIONS = [
  'Tech',
  'Networking',
  'Music',
  'Art',
  'Fitness',
  'Business',
  'Social',
  'Education',
  // ... add other tags as needed
];

export default function EventsPage() {
  const { showNotification } = useNotification();
  const { city } = useCity();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── List & Pagination State ────────────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // ─── Filter State ───────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    tags: [],          // array of selected tags
    availableOnly: false,
  });

  // ─── Tag-dropdown open state ────────────────────────────────────────────────
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);

  // ─── Infinite Scroll Sentinel ───────────────────────────────────────────────
  const sentinelRef = useRef(null);

  // ─── “now” state for live countdown ─────────────────────────────────────────
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Close tag dropdown when clicking outside ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = e => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Fetch Events (with filters) ────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        city,
        ...(filters.search && { q: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        ...(filters.tags.length > 0 && { tags: filters.tags.join(',') }),
      };
      const res = await api.get('events/', { params });
      const list = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setEvents(list);
      setNextUrl(res.data.next || null);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [city, filters]);

  // initial load & reload on city or filters change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ─── Load More (next page) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(nextUrl);
      const more = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setEvents(prev => [...prev, ...more]);
      setNextUrl(res.data.next || null);
    } catch (err) {
      console.error('Error loading more events:', err);
      setError('Failed to load more events.');
    } finally {
      setLoadingMore(false);
    }
  }, [nextUrl, loadingMore]);

  // ─── Infinite Scroll Observer ───────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ─── Countdown Formatter ────────────────────────────────────────────────────
  const formatCountdown = dt => {
    const eventTimeMs = new Date(dt).getTime();
    const diffMs = eventTimeMs - now;
    if (diffMs <= 0) return null;
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // ─── RSVP / Wait-list Toggle ────────────────────────────────────────────────
  const handleRSVP = async (eventId, hasRSVPed, onWaitlist) => {
    if (!user) {
      navigate('/auth');
      showNotification('Login Required.', 'error');
      return;
    }
    try {
      const res = await toggleRSVP(eventId);
      const { message, has_rsvped, on_waitlist } = res.data;
      showNotification(message);
      setEvents(prev =>
        prev.map(evt => {
          if (evt.id !== eventId) return evt;
          // adjust rsvp_count only when actual RSVP toggles
          let rsvp_count = evt.rsvp_count;
          if (has_rsvped && !evt.has_rsvped) {
            // user just RSVPed
            rsvp_count = rsvp_count + 1;
          } else if (!has_rsvped && evt.has_rsvped) {
            // user just cancelled RSVP
            rsvp_count = Math.max(rsvp_count - 1, 0);
          }
          return {
            ...evt,
            has_rsvped,
            on_waitlist,
            rsvp_count,
          };
        })
      );
    } catch (err) {
      console.error('Error toggling RSVP:', err);
      showNotification('Something went wrong.');
    }
  };

  // ─── Handlers for filter inputs ─────────────────────────────────────────────
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // ─── Toggle a tag in filters.tags ──────────────────────────────────────────
  const handleTagToggle = tag => {
    setFilters(prev => {
      const exists = prev.tags.includes(tag);
      const newTags = exists
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Helmet>
        <title>Events | Tealives</title>
      </Helmet>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">
          Events in {city}
        </h1>
        {user && (
          <button
            onClick={() => navigate('/events/create')}
            className="inline-flex items-center gap-2                   border-2
                  
                  bg-transparent border-gray-800 hover:bg-blue-700 dark:text-white text-black cursor-pointer font-medium px-6 py-2 rounded-md shadow transition"
          >
            + Create Event
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category */}
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="conference">Conference</option>
            <option value="meetup">Meetup</option>
            <option value="workshop">Workshop</option>
            <option value="party">Party</option>
            <option value="other">Other</option>
          </select>

          {/* Date From */}
          <label htmlFor="filter-date-from" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            From:
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Date To */}
          <label htmlFor="filter-date-to" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            To:
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Tags multi-select dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              type="button"
              onClick={() => setTagDropdownOpen(o => !o)}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-sm">
                {filters.tags.length > 0 ? `Tags (${filters.tags.length})` : 'Select Tags'}
              </span>
              {tagDropdownOpen ? (
                <FaChevronUp className="text-gray-600 dark:text-gray-300" />
              ) : (
                <FaChevronDown className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
            {tagDropdownOpen && (
              <div className="absolute mt-1 w-48 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-20">
                {TAG_OPTIONS.map(tag => (
                  <label
                    key={tag}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-gray-800 dark:text-gray-200 text-sm">{tag}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading events…</p>
      )}
      {error && (
        <div className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}
      {!loading && !error && events.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No events found.</p>
      )}

      {/* Event Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.map(evt => {
          const countdown = evt.show_countdown ? formatCountdown(evt.datetime) : null;
          const isFull = evt.is_full;
          const hasRSVPed = evt.has_rsvped;
          const onWaitlist = evt.on_waitlist;

          // Action menu handlers
          const handleDeleted = deletedId => {
            setEvents(evs => evs.filter(e => e.id !== deletedId));
          };
          const handleNotInterested = id => {
            setEvents(evs => evs.filter(e => e.id !== id));
          };

          return (
            <div
              key={evt.id}
              className="flex flex-col bg-white relative dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-2xl transition group"
            >
              <div className="absolute top-2 right-2 z-10">
                <EventActionMenu
                  eventId={evt.id}
                  hostId={evt.host.id}
                  currentUser={user}
                  eventTitle={evt.title}
                  onEdit={id => navigate(`/event/${id}/edit`)}
                  onDeleted={handleDeleted}
                  onNotInterested={id =>
                    notInterestedEvent(id)
                      .then(() => handleNotInterested(id))
                      .catch(console.error)
                  }
                />
              </div>

              {evt.banner_url && (
                <div className="relative overflow-hidden">
                  <img
                    src={evt.banner_url}
                    alt={evt.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{evt.title}</h2>
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-2">
                  <FaClock className="mr-1" />
                  <span>{new Date(evt.datetime).toLocaleString()}</span>
                  <span className="mx-2">•</span>
                  <FaMapMarkerAlt className="mr-1" />
                  <span>{evt.location}</span>
                </div>

                {countdown && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">
                    ⏳ Starts in: {countdown}
                  </p>
                )}

                {evt.description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {evt.description}
                  </p>
                )}

                <div className="flex-1" />

                {/* RSVP / Wait-list Button */}
                {evt.host && user && evt.host.id !== user.id && (
                  <>
                    {hasRSVPed ? (
                      <button
                        onClick={() => handleRSVP(evt.id, hasRSVPed, onWaitlist)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                      >
                        <FaTimesCircle /> Cancel RSVP
                      </button>
                    ) : onWaitlist ? (
                      <button
                        onClick={() => handleRSVP(evt.id, hasRSVPed, onWaitlist)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
                      >
                        <FaTimesCircle /> Exit Wait-list
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRSVP(evt.id, hasRSVPed, onWaitlist)}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-white transition ${
                          isFull
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                        {isFull ? (
                          <>
                            <FaClock /> Join Wait-list
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> RSVP
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {/* Contact Host */}
                {user && evt.host.id !== user.id && (
                  <button
                    onClick={() => navigate(`/inbox?to=${evt.host.id}`)}
                    className="
                      mt-2 w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg font-semibold
                      text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition
                    "
                  >
                    Contact Host
                  </button>
                )}

                {/* View Event */}
                <button
                  onClick={() => navigate(`/event/${evt.id}`)}
                  className="
                    mt-2 w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg font-semibold
                    text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition
                  "
                >
                  View Event
                </button>

                <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      evt.is_public
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {evt.is_public ? 'Public' : 'Private'}
                  </span>
                  <span>
                    {evt.rsvp_count} RSVP{evt.rsvp_count !== 1 ? 's' : ''}
                    {evt.rsvp_limit && ` / ${evt.rsvp_limit} max`}
                  </span>
                  {evt.minimum_age && (
                    <span className="w-full text-red-500 dark:text-red-400 font-medium">
                      {evt.minimum_age}+ only
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-8" />
      {loadingMore && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
          Loading more…
        </p>
      )}
    </div>
  );
}
