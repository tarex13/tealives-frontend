// src/components/Badges/BadgeAssignments/BadgeCard.jsx
import React from 'react';

export default function BadgeCardSmall({ badge, selectable, selected, onSelectToggle }) {
  // badge: { id, name, image_url }
  return (
    <div
      className={`flex items-center p-2 border rounded-lg cursor-pointer 
        ${selected ? 'bg-blue-100 dark:bg-blue-700 border-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
        hover:shadow-md transition`}
      onClick={() => selectable && onSelectToggle(badge.id)}
    >
      {badge.icon_url ? (
        <img src={badge.icon_url} alt={badge.name} className="w-8 h-8 rounded-full object-cover mr-2" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
          <span className="text-gray-500 dark:text-gray-400">🏅</span>
        </div>
      )}
      <span className="text-sm text-gray-800 dark:text-gray-100">{badge.name}</span>
      {selectable && (
        <input
          type="checkbox"
          className="ml-auto"
          checked={selected}
          onChange={() => onSelectToggle(badge.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
