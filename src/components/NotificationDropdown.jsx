// src/components/NotificationDropdown.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { markNotificationsRead } from '../requests';
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

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications, markAsRead, reloadNotifications } = useNotification();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Count of unread items
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle clicking a single notification
  const handleNotificationClick = async (n) => {
    try {
      if (!n.is_read) {
        await markAsRead(n.id);
      }
      if (n.link) {
        navigate(n.link);
      }
      setOpen(false);
    } catch (err) {
      console.error('Could not mark notification as read:', err);
    }
  };

  // Bulk “Mark All Read” using the new endpoint
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarkAllLoading(true);
    try {
      await markNotificationsRead(unreadIds);
      reloadNotifications();
    } catch (err) {
      console.error('Bulk mark‐all read failed:', err);
      alert('Failed to mark all as read. Please try again.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  if (!user) return null;

  // Group by date for headings
  const grouped = groupByDate(notifications);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell + badge */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 focus:outline-none"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 z-50">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
              No notifications
            </p>
          ) : (
            <>
              {/* “Mark All Read” Button */}
              <button
                className="w-full text-left text-sm text-blue-600 dark:text-blue-400 mb-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={handleMarkAllRead}
                disabled={markAllLoading || unreadCount === 0}
              >
                {markAllLoading ? 'Marking all…' : 'Mark All Read'}
              </button>

              {/* Grouped List */}
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day} className="mb-4">
                  <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase rounded">
                    {day}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {items.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col ${
                          n.is_read ? 'opacity-70' : 'font-medium'
                        }`}
                      >
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {n.content}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* “View All” Link */}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="w-full text-left text-xs text-blue-600 dark:text-blue-400 mt-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                View All Notifications →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
