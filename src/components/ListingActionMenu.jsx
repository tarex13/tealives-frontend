// src/components/ListingActionMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  toggleSaveListing,
  deleteListing,
  relistListing,
  //getOrCreateConversation,
} from '../requests';

import ReportModal from './ReportModal';
import ReportListModal from './ReportListModal'; // (already there)


import { useNotification } from '../context/NotificationContext';

export default function ListingActionMenu({
  item,
  onEdited,
  onDeleted,
  onRelisted,
  onHide,
  setMarkSoldOpen,
}) {
  const { id, seller, status, is_saved } = item;

  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === seller?.id;
  const canModerate = user?.is_admin || user?.is_moderator;

  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportListOpen, setReportListOpen] = useState(false);

  const { showNotification } = useNotification();
  const menuRef = useRef();

  onRelisted = () => {
    showNotification('Item Relisted!', 'success');
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ───────── Owner Actions ────────────────────────────────────────────────
  const handleEdit = (e) => {
    e.stopPropagation();
    setOpen(false);
    navigate(`/marketplace/${id}/edit`);
    if (onEdited) onEdited();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setOpen(false);
    if (!window.confirm('Delete this listing?')) return;
    try {
      await deleteListing(id);
      if (onDeleted) onDeleted();
    } catch {
      alert('Failed to delete listing.');
    }
  };

  const handleMarkSoldClick = (e) => {
    e.stopPropagation();
    setOpen(false);
    setMarkSoldOpen(true);
  };

  const handleRelist = async (e) => {
    e.stopPropagation();
    setOpen(false);
    try {
      await relistListing(id);
      if (onRelisted) onRelisted();
    } catch {
      alert('Failed to relist.');
    }
  };

  // ───────── Non‐Owner Actions ────────────────────────────────────────────
  const handleMessageSeller = async (e) => {
    e.stopPropagation();
    setOpen(false);

    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      //const res = await getOrCreateConversation(id);
      // Now res.data contains:
      // { conversation_id, item_id, item_title, item_price, item_status, item_thumbnail }
      //const convoId = res.data.conversation_id;
      // Navigate into Inbox, passing both “conversation” and “to” (seller’s id).
      navigate(`/inbox?item=${id}&to=${seller?.id}`);
    } catch {
      alert('Could not open chat.');
    }
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    setOpen(false);
    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      await toggleSaveListing(id);
      // Optionally refresh parent state via onEdited/onDeleted etc.
    } catch {
      alert('Failed to toggle save.');
    }
  };

  const handleReport = (e) => {
    e.stopPropagation();
    setReportOpen(true);
  };

  const handleHide = (e) => {
    e.stopPropagation();
    setOpen(false);
    if (onHide) onHide(id);
  };

  return (
    <div className="relative inline-block text-left " ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full focus:outline-none cursor-pointer"
        title="Actions"
      >
        ⋯
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1 text-sm text-gray-900 dark:text-gray-100">
            {/* Owner‐only actions */}
            {isOwner ? (
              <>
                {status === 'available' && (
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    ✏️ Edit Listing
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 cursor-pointer"
                >
                  🗑️ Delete Listing
                </button>

                {status === 'available' && (
                  <button
                    onClick={handleMarkSoldClick}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    ✅ Mark as Sold
                  </button>
                )}

                {status === 'sold' && (
                  <button
                    onClick={handleRelist}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    🔄 Relist Item
                  </button>
                )}
              </>
            ) : (
              /* Non‐owner actions */
              <>
                {user && (
                  <>
                    <button
                      onClick={handleMessageSeller}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      💬 Message Seller
                    </button>

                    <button
                      onClick={handleSaveToggle}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {is_saved ? '💔 Unsave Listing' : '💖 Save Listing'}
                    </button>

                    <button
                      onClick={handleReport}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 cursor-pointer"
                    >
                      🚩 Report Listing
                    </button>
                  </>
                )}
              </>
            )}

            <button
              onClick={handleHide}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              🙈 Hide Listing
            </button>

            <button
              onClick={() => navigate(`/profile/${seller.username}`)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              🙍 View Profile
            </button>

            {/* Moderator/Admin: “Delete Listing (Mod)” */}
            {canModerate && (
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 cursor-pointer"
              >
                🗑️ Delete Listing (Mod)
              </button>
            )}

            {/* Moderator/Admin: “View Reports” */}
            {canModerate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setReportListOpen(true);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                📝 View Reports
              </button>
            )}
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        contentType="marketplaceitem"
        contentId={id}
        onClose={() => setReportOpen(false)}
        onSuccess={() => {
          setReportOpen(false);
          alert('Listing reported. Thank you.');
        }}
      />

      <ReportListModal
        isOpen={reportListOpen}
        contentType="listing"
        contentId={id}
        onClose={() => setReportListOpen(false)}
      />

    </div>
  );
}
