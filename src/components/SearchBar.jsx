// src/components/SearchBar.jsx
import React from 'react';

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M5 11a6 6 0 1112 0 6 6 0 01-12 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
