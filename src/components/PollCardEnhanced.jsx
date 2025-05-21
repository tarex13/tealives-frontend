import React, { useState, useEffect } from 'react';
import { votePoll } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { FaCheckCircle } from 'react-icons/fa';

const PollCardEnhanced = ({ pollData }) => {
  const { showNotification } = useNotification();
  const [options, setOptions] = useState(pollData.options);
  const [votedOptionId, setVotedOptionId] = useState(pollData.user_vote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const expiry = new Date(pollData.expires_at);
      const now = new Date();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pollData.expires_at]);

  const handleVote = async (optionId) => {
    if (isVoting || isExpired) return;
    setIsVoting(true);

    try {
      const unvote = optionId === votedOptionId;
      const updated = options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes_count: opt.votes_count + (unvote ? -1 : 1) };
        }
        if (opt.id === votedOptionId) {
          return { ...opt, votes_count: opt.votes_count - 1 };
        }
        return opt;
      });
      setOptions(updated);
      setVotedOptionId(unvote ? null : optionId);
      await votePoll(pollData.id, optionId);
      showNotification('Vote updated!', 'success');
    } catch {
      showNotification('Error voting. Try again.', 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = options.reduce((sum, o) => sum + o.votes_count, 0);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-4 rounded-lg shadow-md mb-6 transition">
      <h3 className="text-lg font-semibold mb-2">{pollData.post_title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expires: {new Date(pollData.expires_at).toLocaleString()}</p>
      <p className={`text-sm font-semibold mb-4 ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
        {timeLeft}
      </p>

      {options.map(opt => {
        const percent = totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0;
        const selected = opt.id === votedOptionId;

        return (
          <div key={opt.id} className="mb-3">
            <button
              onClick={() => handleVote(opt.id)}
              disabled={isVoting || isExpired}
              className={`w-full px-3 py-2 rounded-lg flex justify-between items-center text-left transition 
              ${selected ? 'bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-white' : 'bg-gray-100 dark:bg-gray-800'} 
              border border-gray-300 dark:border-gray-700 focus:outline-none`}
            >
              <span>{opt.emoji} {opt.text}</span>
              <span className="flex items-center gap-2">
                {Math.round(percent)}% {selected && <FaCheckCircle className="text-blue-600 dark:text-white" />}
              </span>
            </button>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded mt-1">
              <div className="h-2 bg-blue-500 rounded transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default PollCardEnhanced;
