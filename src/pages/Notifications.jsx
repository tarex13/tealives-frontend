// src/pages/Notifications.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchNotifications,
  markNotificationRead,
  markNotificationsRead,
} from '../requests';
import { Helmet } from 'react-helmet-async';
import { parseISO, isToday, isYesterday } from 'date-fns';

function groupByDate(items) {
  return items.reduce((acc, n) => {
    const d = parseISO(n.created_at);
    const day = isToday(d)
      ? 'Today'
      : isYesterday(d)
      ? 'Yesterday'
      : d.toLocaleDateString();
    (acc[day] ||= []).push(n);
    return acc;
  }, {});
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const sentinelRef = useRef();

  // 1️⃣ Load first page on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadFirstPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNotifications(); 
        const data = res?.data ?? res;
        setNotifications(data.results || []);
        setNextPage(data.next);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError('Could not load notifications.');
      } finally {
        setLoading(false);
      }
    };

    loadFirstPage();
  }, [user]);

  // 2️⃣ Infinite scroll for “nextPage”
  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchNotifications(nextPage);
      const data = res.data;
      setNotifications(prev => [...prev, ...(data.results || [])]);
      setNextPage(data.next);
    } catch (err) {
      console.error('Failed to load more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    );
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [loadMore]);

  // 3️⃣ Toggle a notification checkbox
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // 4a. Bulk “Mark Selected as Read”
  const markSelectedRead = async () => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);

    try {
      await markNotificationsRead(idsArray);
      setNotifications(prev =>
        prev.map(n =>
          idsArray.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to bulk mark as read:', err);
      alert('Could not mark as read. Please try again.');
    }
  };

  // 4b. “Mark All Read” button
  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await markNotificationsRead(unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      alert('Could not mark all as read. Please try again.');
    }
  };

  // 5️⃣ Click a single notification
  const handleClickNotification = async (n) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setNotifications(prev =>
          prev.map(x => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch {
        // ignore
      }
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-gray-700 dark:text-gray-300">
        You must be logged in to view notifications.
      </div>
    );
  }

  // Group by date for headings
  const grouped = groupByDate(notifications);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Helmet>
        <title>Notifications | Tealives</title>
      </Helmet>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Notifications
      </h1>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading notifications…
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800 p-4 rounded">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You have no notifications.
        </p>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={markSelectedRead}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Mark Selected as Read
            </button>
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 mb-2 underline"
            >
              Mark All Read
            </button>
          </div>

          {/* Unread count */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {notifications.filter(n => !n.is_read).length} unread
          </p>

          {/* Notification List (grouped by date) */}
          <div className="space-y-6 mt-4">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day} className="space-y-2">
                <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase rounded">
                  {day}
                </div>
                <ul className="space-y-2">
                  {items.map(n => (
                    <li
                      key={n.id}
                      className={`flex items-start p-3 rounded cursor-pointer ${
                        n.is_read
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'bg-white dark:bg-gray-800 shadow'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(n.id)}
                        onChange={() => toggleSelect(n.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <button
                          onClick={() => handleClickNotification(n)}
                          className="w-full text-left"
                        >
                          <div className="flex justify-between">
                            <p className="text-gray-900 dark:text-gray-100 hover:underline">
                              {n.content}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Sentinel for Lazy Loading */}
            {nextPage && (
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {loadingMore ? (
                  <p className="text-gray-500 dark:text-gray-400">Loading more…</p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500">Scroll to load more</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
