import React, { useState } from 'react'
import { sendReaction } from '../requests'  
import { useAuth } from '../context/AuthContext'
import api from '../api';

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🔥']

function FeedCard({ post }) {
  const { user } = useAuth()
  const [pollOptions, setPollOptions] = useState(post.poll_options || []);
  const [hasVoted, setHasVoted] = useState(post.user_has_voted);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(post.reaction_summary || {})
  const [userReacts, setUserReacts] = useState(post.user_reactions || [])
  const [loadingEmoji, setLoadingEmoji] = useState(null)

  const handleVote = async (optionId) => {
    if (hasVoted) return;
    try {
      await api.post(`polls/vote/${optionId}/`);
      const updatedOptions = pollOptions.map((opt) =>
        opt.id === optionId ? { ...opt, votes_count: opt.votes_count + 1 } : opt
      );
      setPollOptions(updatedOptions);
      setHasVoted(true);
    } catch (err) {
      setError('Failed to record vote.');
    }
  };

  const toggleReaction = async (emoji) => {
    if (loadingEmoji) return  // ignore while another reaction is in progress
  
    setLoadingEmoji(emoji)
    try {
      await sendReaction(post.id, emoji)
  
      const hasReacted = userReacts.includes(emoji)
      const newCount = (summary[emoji] || 0) + (hasReacted ? -1 : 1)
  
      setSummary((prev) => ({
        ...prev,
        [emoji]: Math.max(0, newCount),
      }))
  
      setUserReacts((prev) =>
        hasReacted ? prev.filter((e) => e !== emoji) : [...prev, emoji]
      )
    } catch (err) {
      setError('Reaction failed');
      console.error('Reaction failed', err)
    } finally {
      setLoadingEmoji(null)
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-3">
      <div className="flex items-center gap-2 mb-1">
  <h3 className="text-lg font-bold">{post.title}</h3>
  {post.reactions && Object.values(post.reactions).reduce((a, b) => a + b, 0) > 5 && (//How we are defining trending
    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
      🔥 Trending
    </span>
  )}
</div>
      <h3 className="text-lg font-bold">{post.title}</h3>
      <p className="text-sm text-gray-600">{post.content}</p>

      {post.post_type === 'poll' && pollOptions.length > 0 && (
        <div className="mt-2">
          <h4 className="font-semibold mb-1">Poll:</h4>
          {pollOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted}
              className={`block w-full text-left p-2 rounded mb-1 ${
                hasVoted ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {opt.text} — {opt.votes_count} votes
            </button>
          ))}
          {hasVoted && <p className="text-xs text-green-600 mt-1">You have voted.</p>}
        </div>
      )}


      <div className="mt-2 flex gap-2">
        {ALLOWED_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            disabled={loadingEmoji === emoji}
            className={`text-lg px-2 py-1 rounded ${
              userReacts.includes(emoji)
                ? 'bg-blue-100 text-blue-600 font-bold'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {emoji} {summary[emoji] || 0}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}

export default FeedCard
