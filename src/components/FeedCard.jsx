// src/components/FeedCard.jsx
import React, { useState } from 'react';
import { sendReaction } from '../requests';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import MediaCarousel from './MediaCarousel';
import PostActionMenu from './PostActionMenu';
import PollCardEnhanced from './PollCardEnhanced';
import CommentSection from '../pages/CommentSection';
import { MessageCircle, Pin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🔥'];
const TYPE_STYLES = {
  discussion: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100',
  question:   'bg-teal-100 text-teal-800   dark:bg-teal-800   dark:text-teal-100',
  rant:       'bg-pink-100 text-pink-800   dark:bg-pink-800   dark:text-pink-100',
  poll:       'bg-green-100 text-green-800  dark:bg-green-800  dark:text-green-100',
  alert: {
    low:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    high:   'bg-red-100 text-red-800    dark:bg-red-800    dark:text-red-100',
  },
};

export default function FeedCard({ post, refetchPostData }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Reaction state
  const [summary, setSummary]     = useState(post.reaction_summary || {});
  const [userReacts, setUserReacts] = useState(post.user_reactions || []);
  const [loadingEmoji, setLoadingEmoji] = useState(null);
  const [showComments, setShowComments] = useState(false);

  // Poll fallback
  if (post.post_type === 'poll' && post.poll_details) {
    return <PollCardEnhanced post={post} pollData={post.poll_details} />;
  }

  // Type pill styling
  const typeLabel =
    post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1);
  let pillStyle = TYPE_STYLES[post.post_type];
  if (post.post_type === 'alert') {
    const pri = (post.priority || 'low').toLowerCase();
    pillStyle = TYPE_STYLES.alert[pri] || TYPE_STYLES.alert.low;
  }

  // Called when the “Edit” menu item is clicked
  const onEditClick = (pid) => {
    navigate(`/posts/${pid}/edit`);
  };

  const handleReaction = async (emoji) => {
    setLoadingEmoji(emoji);
    try {
      await sendReaction(post.id, emoji);
      const updated = { ...summary };
      const nextUser = [...userReacts];
      const exists = nextUser.includes(emoji);

      if (exists) {
        updated[emoji] = Math.max(0, updated[emoji] - 1);
        nextUser.splice(nextUser.indexOf(emoji), 1);
      } else {
        updated[emoji] = (updated[emoji] || 0) + 1;
        nextUser.push(emoji);
      }

      setSummary(updated);
      setUserReacts(nextUser);
    } catch {
      showNotification('Failed to update reaction.', 'error');
    } finally {
      setLoadingEmoji(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-6 overflow-x-hidden break-words">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b dark:border-gray-700">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 flex-shrink-0">
            {post.profile_pic ? (
              <img
                src={post.profile_pic}
                alt={post.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="h-full flex items-center justify-center text-gray-800 dark:text-gray-200 font-semibold">
                {post.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {post.anonymous ? (
                'Anonymous User'
              ) : (
                <Link to={`/profile/${post.username}`} className="hover:underline">
                  @{post.username}
                </Link>
              )}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {new Date(post.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              })}
            </span>
            {post.group_info && (
              <Link
                to={`/groups/${post.group_info.id}`}
                className="mt-1 flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                {post.group_info.avatar_url && (
                  <img
                    src={post.group_info.avatar_url}
                    alt="Group"
                    className="w-5 h-5 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                  />
                )}
                <span className="px-2 h-5 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center font-bold">
                  Group Post
                </span>
                <span>{post.group_info.name}</span>
              </Link>
            )}
          </div>
        </div>

        {/* ────── Actions (Pin, Edit, Report, etc.) ────── */}
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          {post.is_pin_active && (
            <span className="inline-flex items-center bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300 text-xs font-medium px-2 py-0.5 rounded-full">
              <Pin className="w-4 h-4 mr-1" /> Pinned
            </span>
          )}
          {user && (
            <PostActionMenu
              postId={post.id}
              postOwnerId={post.ownerId}
              postOwnerUsername={post.username}
              currentUserId={user.id}
              isAnonymous={post.anonymous}
              isPinActive={post.is_pin_active}
              pinnedByAdmin={post.is_pinned}
              onEditClick={onEditClick}
            />
          )}
        </div>
      </div>

      {/* ────── Title + Type Pill ────── */}
      <div className="px-4 sm:px-6 pt-3 pb-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white  break-all">
          {post.title}
          <span
            className={`inline-block text-xs uppercase font-semibold px-2 py-0.5 rounded-full ${pillStyle}`}
          >
            {typeLabel}
            {post.post_type === 'alert' ? ` (${post.priority || 'low'})` : ''}
          </span>
        </h2>
      </div>

      {/* ────── Content ────── */}
      <div className="px-4 sm:px-6 pb-4">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words  break-all">
          {post.content}
        </p>
      </div>

      {/* ────── Media ────── */}
      {post.media_files?.length > 0 && (
        <div className="px-4 sm:px-6 pb-4 max-w-full overflow-hidden">
          <MediaCarousel mediaFiles={post.media_files} />
        </div>
      )}

      {/* ────── Reactions ────── */}
      <div className="px-4 sm:px-6 py-3 border-t dark:border-gray-700 flex flex-wrap gap-2">
        {ALLOWED_REACTIONS.map((emoji) => {
          const count = summary[emoji] || 0;
          const active = userReacts.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              disabled={loadingEmoji === emoji}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-transform hover:scale-105 ${
                active
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={active}
            >
              <span className="text-lg">{emoji}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ────── Comments ────── */}
      {!['poll', 'alert'].includes(post.post_type) && (
        <div className="px-4 sm:px-6 py-3 border-t dark:border-gray-700">
          <button
            onClick={() => setShowComments((s) => !s)}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:underline focus:outline-none"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {showComments ? 'Hide Comments' : `View Comments (${post.comment_count || 0})`}
          </button>
          {showComments && (
            <div className="mt-3">
              <CommentSection
                postId={post.id}
                simpleMode={post.post_type === 'rant'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
