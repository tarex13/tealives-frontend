// src/components/BidItem.jsx
import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function BidItem({ bid, onAction }) {
  const { bidder_username, amount, message, status, created_at } = bid;

  return (
    <li className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
      {/* Left Side: Bid Info */}
      <div className="flex-1 mb-4 sm:mb-0">
        <p className="text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold">@{bidder_username}</span> bid{' '}
          <span className="font-medium text-green-700 dark:text-green-300">
            ${amount}
          </span>
        </p>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-1">
            “{message}”
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDistanceToNow(parseISO(created_at), { addSuffix: true })}
        </p>
        <p className="text-xs mt-1">
          Status:{' '}
          <span
            className={`font-medium ${
              status === 'pending'
                ? 'text-yellow-600 dark:text-yellow-400'
                : status === 'accepted'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-600 dark:text-red-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </p>
      </div>

      {/* Right Side: Action Buttons */}
      {status === 'pending' && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAction('accept')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Accept
          </button>
          <button
            onClick={() => onAction('reject')}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Reject
          </button>
        </div>
      )}
    </li>
  );
}
