// src/components/ReviewCard.jsx
import React, { useState } from 'react';
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
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link to={`/user/public/${review.author_id}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mr-2">
              <span className="block text-center text-gray-500 leading-8">
                {review.author.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>
          <div>
            <p className="font-semibold">
              <Link to={`/user/public/${review.author_id}`} className="hover:underline">
                {review.author}
              </Link>
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      {text && (
        <p className="text-gray-800">
          {display}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 ml-1 text-sm"
            >
              {expanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
