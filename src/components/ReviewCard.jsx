// src/components/ReviewCard.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(review.created);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });

  const text = review.comment || '';
  const isLong = text.length > 200;
  const display = !expanded && isLong ? text.slice(0, 200) + '…' : text;

  return (
    <div className="mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-6">
        {/* Author & timestamp */}
        <Link
          to={`/profile/${review.author.username}`}
          className="flex items-center space-x-3 flex-shrink-0"
        >
          {review.author.profile_image ? (
            <img
            loading="lazy"
              src={review.author.profile_image}
              alt={`${review.author.username}'s avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">
                {review.author.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex-1">
          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${review.author.username}`}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
            >
              {review.author.username}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
            </span>
          </div>
          {/* Star rating */}
          <div className="flex items-center space-x-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`flex-shrink-0 text-xl ${
                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          {/* Comment */}
          {text && (
            <div className="mt-3 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {display}
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-blue-600 hover:underline text-sm"
                >
                  {expanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    created: PropTypes.string.isRequired,
    author: PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string.isRequired,
      profile_image: PropTypes.string,
    }).isRequired,
  }).isRequired,
};
