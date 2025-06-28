// src/components/EventActionMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { deleteEvent } from '../requests'; // you'll need to add this endpoint

export default function EventActionMenu({
  eventId,
  hostId,
  eventTitle,
  currentUser,
  onEdit,
  onDeleted,
  onNotInterested,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const isOwner = user?.id === hostId;
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Delete event
  const handleDelete = async () => {
    setOpen(false);
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      showNotification('Event deleted.', 'success');
      onDeleted?.();
    } catch (err) {
      console.error(err);
      showNotification('Failed to delete event.', 'error');
    }
  };

  // Not interested
  const handleNotInterested = () => {
    setOpen(false);
    onNotInterested?.(eventId);
    showNotification('Marked not interested.', 'info');
  };

  // Copy to clipboard
  const url = `${window.location.origin}/event/${eventId}`;
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showNotification('Link copied to clipboard!', 'success');
    } catch {
      showNotification('Failed to copy link.', 'error');
    }
  };

  // Share via Web Share API
  const handleShare = async () => {
    const shareText = `Hey! Join me at "${eventTitle}" on Tealives. RSVP here: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, text: shareText, url });
      } catch (err) {
        console.error(err);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const menuItemClass =
    'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={e => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer"
        aria-label="Event options"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <div className="p-1 text-sm text-gray-900 dark:text-gray-100">
            {isOwner && (
              <>
                <div
                  className={menuItemClass}
                  onClick={() => { setOpen(false); onEdit?.(eventId); }}
                >
                  Edit Event
                </div>
                <div
                  className={menuItemClass}
                  onClick={handleDelete}
                >
                  Delete Event
                </div>
              </>
            )}

            {isLoggedIn && !isOwner && (
              <>
                <div
                  className={menuItemClass}
                  onClick={() => { setOpen(false); navigate(`/inbox?to=${hostId}`); }}
                >
                  Message Host
                </div>
                <div
                  className={menuItemClass}
                  onClick={handleNotInterested}
                >
                  Not Interested
                </div>
              </>
            )}

            {/*
            <div className={menuItemClass}>
              Report Event
            </div>
            */}

            <div className={menuItemClass} onClick={handleShare}>
              Share Event…
            </div>
            <div className={menuItemClass} onClick={handleCopyLink}>
              Copy Link
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
