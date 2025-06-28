// src/components/Badges/BadgeAssignments/SearchFilterBar.jsx
import React from 'react';

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  filters = [],              // ← default to empty array
  onFilterChange = () => {}, // ← default to no-op
  placeholder = 'Search...',
}) {
  // filters: array of { label, name, options: [{ value, label }], value }
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      <input
        type="text"
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <select
            key={f.name}
            className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            value={f.value}
            onChange={(e) => onFilterChange(f.name, e.target.value)}
          >
            <option value="">{f.label}</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
