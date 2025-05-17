import React, { useState, useEffect } from 'react';
import { votePoll } from '../requests';
import { useNotification } from '../context/NotificationContext';
import classNames from 'classnames';
import { FaCheckCircle } from 'react-icons/fa';

const PollCardEnhanced = ({ pollData }) => {
  const { showNotification } = useNotification();
  const [options, setOptions] = useState(pollData.options);
  const [votedOptionId, setVotedOptionId] = useState(pollData.user_vote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // 🕒 Countdown Timer Logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!pollData.expires_at) return;

      const expiry = new Date(pollData.expires_at);
      const now = new Date();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [pollData.expires_at]);

  const handleVote = async (optionId) => {
    if (isVoting || isExpired) return;

    const isUnvoting = votedOptionId === optionId;
    setIsVoting(true);

    try {
      const updatedOptions = options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes_count: opt.votes_count + (isUnvoting ? -1 : 1) };
        } else if (!isUnvoting && opt.id === votedOptionId) {
          return { ...opt, votes_count: opt.votes_count - 1 };
        }
        return opt;
      });

      setOptions(updatedOptions);
      setVotedOptionId(isUnvoting ? null : optionId);

      await votePoll(pollData.id, optionId);
      showNotification(isUnvoting ? 'Vote removed.' : 'Vote submitted successfully!', 'success');
    } catch (error) {
      console.error('Error voting on poll:', error);
      showNotification('Failed to process vote. Please try again.', 'error');
      setOptions(pollData.options);
      setVotedOptionId(pollData.user_vote || null);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes_count, 0);
  const formattedExpiry = pollData.expires_at 
    ? new Date(pollData.expires_at).toLocaleString('en-US', { timeZoneName: 'short' })
    : null;

  return (
    <div className="p-4 border rounded-xl shadow mb-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">{pollData.post_title}</h3>

      {pollData.expires_at && (
        <>
          <div className="text-sm text-gray-500 mb-1">
            Expires At: {formattedExpiry}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            {isExpired ? 'Poll expired.' : `Time left: ${timeLeft}`}
          </div>
        </>
      )}

      {options.map(option => {
        const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0;
        const isSelected = option.id === votedOptionId;

        return (
          <div key={option.id} className="mb-3">
            <button
              onClick={() => handleVote(option.id)}
              disabled={isVoting || isExpired}
              aria-pressed={isSelected}
              aria-label={`Vote for ${option.text}`}
              className={classNames(
                'w-full text-left p-3 rounded-lg transition relative focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center',
                {
                  'bg-blue-100 border border-blue-500': isSelected,
                  'bg-gray-100 hover:bg-gray-200': !isSelected,
                  'opacity-50 cursor-not-allowed': isVoting || isExpired,
                }
              )}
            >
              <span>
                {option.emoji ? `${option.emoji} ` : ''}
                {option.text}
              </span>
              <span className="flex items-center gap-2">
                {Math.round(percentage)}%
                {isSelected && <FaCheckCircle className="text-blue-600 animate-bounce" />}
              </span>
            </button>

            <div className="w-full bg-gray-300 h-2 rounded mt-1">
              <div
                className="h-2 bg-blue-500 rounded transition-all duration-500"
                style={{ width: `${percentage}%` }}
                title={`${percentage.toFixed(2)}%`}
              ></div>
            </div>
          </div>
        );
      })}

      <div className="text-sm text-gray-600 mt-4">
        {totalVotes > 0 ? `${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}` : 'No votes yet.'}
      </div>
    </div>
  );
};

export default PollCardEnhanced;
