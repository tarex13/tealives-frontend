// src/components/Badges/BadgeAssignments/UserCard.jsx
import React from 'react';

export default function UserCard({
  user,
  currentBadges = [],
  onRemoveBadge,
  selectable = false,
  selected = false,
  onSelectToggle,
  onClick = () => {},
}) {
  // user: { id, username, display_name, profile_image_url, city }

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex flex-col p-4 bg-white dark:bg-gray-800 
        border ${ selected 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900'
          : 'border-gray-200 dark:border-gray-700'
        } rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer
      `}
    >
      {/* Top row: Avatar + Info + (optional) checkbox */}
      <div className="flex items-center">
        {/* Avatar */}
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-500 dark:text-gray-400 text-lg">👤</span>
          </div>
        )}

        {/* Name & Username */}
        <div className="ml-3 flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {user.display_name || user.username}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{user.username}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            City: {user.city}
          </p>
        </div>

        {/* Bulk-select checkbox */}
        {selectable && (
          <label className="ml-2 flex items-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelectToggle(user.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        )}
      </div>

      {/* Badges */}
      {currentBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {currentBadges.map((badge) => (
            <div
              key={badge.id}
              className="
                flex items-center space-x-1 bg-blue-100 dark:bg-blue-900
                text-blue-800 dark:text-blue-200 rounded-full px-3 py-1
                text-xs font-medium transition-colors duration-150
                group-hover:bg-blue-200 dark:group-hover:bg-blue-800
              "
            >
              <span className="truncate">{badge.name}</span>
              {onRemoveBadge && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBadge(user.id, badge.id);
                  }}
                  aria-label={`Remove badge ${badge.name}`}
                  className="
                    flex-shrink-0 p-1 hover:text-red-600 dark:hover:text-red-400
                    transition-colors duration-150
                  "
                >
                  {/* Simple X icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586 
                         l4.293-4.293a1 1 0 011.414 1.414L11.414
                         10l4.293 4.293a1 1 0 01-1.414
                         1.414L10 11.414l-4.293 4.293a1 1 0
                         01-1.414-1.414L8.586 10 4.293
                         5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
