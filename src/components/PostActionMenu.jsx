// src/components/PostActionMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { handlePin, deletePost } from '../requests';
import ReportModal from './ReportModal';
import { useNotification } from '../context/NotificationContext';

export default function PostActionMenu({
  postId,
  postOwnerId,
  postOwnerUsername,
  currentUserId,
  isAnonymous,
  isPinActive,
  pinnedByAdmin,
  onEditClick,   // callback(postId) ⇒ void, provided by parent
  onDeleted,     // callback() ⇒ void, provided by parent
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const [reportOpen, setReportOpen] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const isOwner = postOwnerId && currentUserId && postOwnerId === currentUserId;
  const canModerate = user?.is_admin || user?.is_moderator;
  const { showNotification } = useNotification();

  // Pin states
  const [personalPinned, setPersonalPinned] = useState(
    Boolean(isPinActive && !pinnedByAdmin)
  );
  const [globalPinned, setGlobalPinned] = useState(Boolean(pinnedByAdmin));
  const active = personalPinned || globalPinned;

  useEffect(() => {
    setPersonalPinned(Boolean(isPinActive && !pinnedByAdmin));
    setGlobalPinned(Boolean(pinnedByAdmin));
  }, [isPinActive, pinnedByAdmin]);

  // Close menu if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle personal pin
  const togglePersonal = async (unpin) => {
    setPersonalPinned(!unpin);
    setOpen(false);
    try {
      await handlePin(postId, 'personal', unpin);
    } catch {
      setPersonalPinned(unpin);
    }
  };

  // Toggle global pin (moderator only)
  const toggleGlobal = async (unpin) => {
    setGlobalPinned(!unpin);
    setOpen(false);
    try {
      await handlePin(postId, 'global', unpin);
    } catch {
      setGlobalPinned(unpin);
    }
  };

  // Delete post
  const handleDelete = async () => {
    setOpen(false);
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.reload();
      }
      showNotification('Post deleted.', 'success');
    } catch (err) {
      console.error('Error deleting post:', err);
      showNotification('Failed to delete post.', 'error');
    }
  };

  // Navigate helper (fallback if onEditClick not provided)
  const handleNavigation = (url) => {
    window.location.href = url;
  };

  const menuItemClass =
    'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
        aria-label="Post options"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <div className="p-1 text-sm text-gray-900 dark:text-gray-100">
            {isLoggedIn && (
              <>
                {!active ? (
                  <>
                    <button
                      onClick={() => togglePersonal(false)}
                      className={menuItemClass}
                    >
                      📌 Pin to My Feed
                    </button>
                    {canModerate && !globalPinned && (
                      <button
                        onClick={() => toggleGlobal(false)}
                        className={menuItemClass}
                      >
                        🌍 Pin for Everyone
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {personalPinned && (
                      <button
                        onClick={() => togglePersonal(true)}
                        className={menuItemClass}
                      >
                        🔓 Unpin from My Feed
                      </button>
                    )}
                    {canModerate && globalPinned && (
                      <button
                        onClick={() => toggleGlobal(true)}
                        className={menuItemClass}
                      >
                        🚫 Unpin for Everyone
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {isLoggedIn && !isAnonymous && !isOwner && (
              <button
                onClick={() =>
                  handleNavigation(`/chat/${postOwnerId}`)
                }
                className={menuItemClass}
              >
                💬 Chat with {postOwnerUsername}
              </button>
            )}

            {!isAnonymous && (
              <button
                onClick={() =>
                  handleNavigation(`/profile/${postOwnerUsername}`)
                }
                className={menuItemClass}
              >
                🙍 View Profile
              </button>
            )}

            {isOwner && (
              <>
                <button
                  onClick={() => {
                    setOpen(false);
                    if (onEditClick) {
                      onEditClick(postId);
                    } else {
                      handleNavigation(`/posts/${postId}/edit`);
                    }
                  }}
                  className={menuItemClass}
                >
                  ✏️ Edit Post
                </button>

                <button
                  onClick={handleDelete}
                  className={`${menuItemClass} text-red-500`}
                >
                  🗑️ Delete Post
                </button>
              </>
            )}

            {isLoggedIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReportOpen(true);
                }}
                className={`${menuItemClass} text-red-500`}
              >
                🚩 Report Post
              </button>
            )}

            <button
              onClick={() => console.log('Hide Post')}
              className={menuItemClass}
            >
              🙈 Hide Post
            </button>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        contentType="post"
        contentId={postId}
        onClose={() => setReportOpen(false)}
        onSuccess={() => {
          setReportOpen(false);
          showNotification(
            'Thanks for reporting. Our team will review shortly.',
            'success'
          );
        }}
      />
    </div>
  );
}
