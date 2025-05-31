// src/components/PollCardEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { votePoll } from '../requests';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PostActionMenu from './PostActionMenu';
import { FaCheckCircle } from 'react-icons/fa';
import { Pin } from 'lucide-react';

const TYPE_STYLES = {
  poll: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
};

export default function PollCardEnhanced({ post, pollData }) {
  const { user }            = useAuth();
  const { showNotification}= useNotification();

  const [options,       setOptions]   = useState(pollData.options);
  const [votedOptionId, setVoted]     = useState(pollData.user_vote || null);
  const [isVoting,      setIsVoting]  = useState(false);
  const [timeLeft,      setTimeLeft]  = useState('');
  const [isExpired,     setIsExpired] = useState(false);

  // Countdown Timer
  useEffect(() => {
    const update = () => {
      if(pollData.expires_at){
        const diff = new Date(pollData.expires_at).getTime() - Date.now();
        if (diff <= 0) {
          setIsExpired(true);
          setTimeLeft('Expired');
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      }
      
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [pollData.expires_at]);

  // Optimistic voting
  const handleVote = async optId => {
    if (isVoting || isExpired) return;
    setIsVoting(true);

    const unvote = optId === votedOptionId;
    // locally bump counts
    setOptions(opts => opts.map(o => {
      if (o.id === optId)           return { ...o, votes_count: o.votes_count + (unvote ? -1 : 1) };
      if (o.id === votedOptionId)   return { ...o, votes_count: o.votes_count - 1 };
      return o;
    }));
    setVoted(unvote ? null : optId);

    try {
      await votePoll(pollData.id, optId);
      showNotification('Vote recorded!', 'success');
    } catch {
      setOptions(pollData.options);
      setVoted(pollData.user_vote || null);
      showNotification('Error voting. Please try again.', 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = options.reduce((sum, o) => sum + o.votes_count, 0);
  const initial    = post.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden flex-shrink-0">
            {post.user?.avatar_url
              ? <img src={post.user.avatar_url} alt={post.username} className="h-full w-full object-cover" />
              : <span className="h-full flex items-center justify-center text-gray-800 dark:text-gray-200 font-semibold">
                  {initial}
                </span>
            }
          </div>
          {/* Username + timestamp */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              @{post.anonymous ? 'Anonymous' : post.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {new Date(post.created_at).toLocaleString([], {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric'
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
        {/* Pin + menu */}
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          {post.is_pin_active && (
            <span className="inline-flex items-center bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300 text-xs font-medium px-2 py-0.5 rounded-full">
              <Pin className="w-4 h-4 mr-1" /> Pinned
            </span>
          )}
          <PostActionMenu
            postId={post?.id}
            postOwnerId={post?.ownerId}
            postOwnerUsername={post?.username}
            currentUserId={user?.id}
            isAnonymous={post?.anonymous}
            isPinActive={post?.is_pin_active}
            pinnedByAdmin={post?.is_pinned}
          />
        </div>
      </div>

      {/* Title + Poll pill + Countdown */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
          {pollData.post_title}
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES.poll}`}>
            Poll
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Description */}
      {pollData.post_description && (
        <div className="px-6 pb-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {pollData.post_description}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="px-6 space-y-4">
        {options.map(opt => {
          const pct      = totalVotes ? (opt.votes_count / totalVotes) * 100 : 0;
          const selected = opt.id === votedOptionId;
          return (
            <div key={opt.id} className="space-y-1">
              <button
                onClick={() => handleVote(opt.id)}
                disabled={isVoting || isExpired}
                className={`
                  w-full flex justify-between px-4 py-2 rounded-xl border transition
                  ${selected
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-800 dark:border-blue-600'
                    : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                  hover:scale-[1.01] focus:outline-none
                `}
              >
                <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="font-medium">{opt.text}</span>
                </span>
                <span className="flex items-center gap-1 text-sm">
                  {Math.round(pct)}%
                  {selected && <FaCheckCircle className="text-blue-600 dark:text-blue-300" />}
                </span>
              </button>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-300 dark:from-blue-600 dark:to-blue-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vote count */}
      <div className="px-6 py-4 mt-2 bg-gray-50 dark:bg-gray-800 text-right">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
