import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotification();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = async (n) => {
    try {
      await markAsRead(n.id);
      if (n.link) navigate(n.link);
    } catch {
      console.error('Could not mark notification as read.');
    }
  };

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-800 shadow-lg rounded p-2 z-50">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications</p>
          ) : (
            <>
              <button
                className="text-xs text-blue-600 mb-2 underline"
                onClick={() =>
                  notifications.forEach((n) => {
                    if (!n.is_read) markAsRead(n.id);
                  })
                }
              >
                Mark all read
              </button>
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
