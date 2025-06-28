// src/components/Badges/BadgeDefinitions/BadgeCard.jsx
import React from 'react';

export default function BadgeCard({ badge, onEdit, onActivateToggle, onDelete }) {
  // badge: { id, name, code, description, badge_type, image_url, is_active, created_at }
  const typeColors = {
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-white',
    seller: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-white',
    mod: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-white',
    business: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-white',
  };
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-md transition p-4 flex flex-col">
      <div className="flex items-center mb-2">
        {badge.icon_url ? (
          <img
            src={badge.icon_url}
            alt={badge.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex items-center justify-center">
            {/* placeholder icon */}
            <span className="text-gray-500 dark:text-gray-400">🏅</span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{badge.name}</h3>
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${typeColors[badge.badge_type] || 'bg-gray-100 text-gray-800'}`}
          >
            {badge.badge_type.charAt(0).toUpperCase() + badge.badge_type.slice(1)}
          </span>
        </div>
      </div>
      {badge.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-2">
          {badge.description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {badge.is_active ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-white rounded-full">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-800 dark:text-white rounded-full">
              Inactive
            </span>
          )}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(badge)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            title="Edit badge"
          >
            ✏️
          </button>
          <button
            onClick={() => onActivateToggle(badge)}
            className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            title={badge.is_active ? 'Deactivate' : 'Activate'}
          >
            {badge.is_active ? '🔒' : '🔓'}
          </button>
          <button
            onClick={() => onDelete(badge)}
            className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            title="Delete badge"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
