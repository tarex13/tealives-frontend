import React, { useState } from 'react';
import { sendReaction } from '../requests';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import MediaCarousel from './MediaCarousel';
import PostActionMenu from './PostActionMenu';
import PollCardEnhanced from './PollCardEnhanced';
import CommentSection from '../pages/CommentSection';

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🔥'];

function FeedCard({ post }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [summary, setSummary] = useState(post.reaction_summary || {});
  const [userReacts, setUserReacts] = useState(post.user_reactions || []);
  const [loadingEmoji, setLoadingEmoji] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const handleReaction = async (emoji) => {
    try {
      setLoadingEmoji(emoji);
      await sendReaction(post.id, emoji);
      const newSummary = { ...summary };
      const newUserReacts = [...userReacts];
      const hasReacted = newUserReacts.includes(emoji);

      if (hasReacted) {
        newSummary[emoji] = Math.max(0, (newSummary[emoji] || 1) - 1);
        newUserReacts.splice(newUserReacts.indexOf(emoji), 1);
      } else {
        newSummary[emoji] = (newSummary[emoji] || 0) + 1;
        newUserReacts.push(emoji);
      }

      setSummary(newSummary);
      setUserReacts(newUserReacts);
    } catch {
      showNotification('Failed to update reaction.', 'error');
    } finally {
      setLoadingEmoji(null);
    }
  };

  if (post.post_type === 'poll' && post.poll_details) {
    return <PollCardEnhanced pollData={post.poll_details} />;
  }

  return (
    <div className="rounded-xl shadow-md mb-6 bg-white dark:bg-gray-900 p-5 hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold text-gray-900 dark:text-white truncate">
          @{post.anonymous ? 'Anonymous' : post?.username || 'Unknown'} – {post.title}
        </p>
        <PostActionMenu
          postId={post.id}
          postOwnerId={post.user?.id}
          postOwnerUsername={post.user?.username}
          currentUserId={user?.id}
          isAnonymous={post.anonymous}
        />
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">{post.content}</p>

      {post.media_files?.length > 0 && <MediaCarousel mediaFiles={post.media_files} />}

      <div className="mt-3 flex flex-wrap gap-2">
        {ALLOWED_REACTIONS.map((emoji) => {
          const count = summary[emoji] || 0;
          const hasReacted = userReacts.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              disabled={loadingEmoji === emoji}
              className={`flex items-center gap-1 text-lg px-3 py-1 rounded-full font-medium focus:outline-none transition-all 
              ${hasReacted ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'} 
              hover:scale-105`}
              aria-pressed={hasReacted}
              aria-label={`React with ${emoji}`}
            >
              <span>{emoji}</span>
              <span className="text-sm">{count}</span>
            </button>
          );
        })}
      </div>

      {!['poll', 'alert'].includes(post.post_type) && (
        <div className="mt-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline focus:outline-none"
            aria-expanded={showComments}
          >
            {showComments ? 'Hide Comments' : `View Comments (${post.comment_count || 0})`}
          </button>

          {showComments && <CommentSection postId={post.id} simpleMode={post.post_type === 'rant'} />}
        </div>
      )}
    </div>
  );
}

export default FeedCard;
