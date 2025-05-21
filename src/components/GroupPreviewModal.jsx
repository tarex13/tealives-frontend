import React from 'react';

export default function GroupPreviewModal({ group, onClose, onJoin }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
        <p className="text-gray-600 mb-4">{group.description || 'No description provided.'}</p>
        <div className="text-sm text-gray-500 mb-4">
          <p>👤 Creator: {group.creator?.username || 'Unknown'}</p>
          <p>👥 Members: {group.member_count}</p>
          <p>Status: {group.is_public ? 'Public' : 'Private'}</p>
        </div>
        <button
          onClick={() => onJoin(group.id)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mb-2"
        >
          Join Group
        </button>
        <button
          onClick={onClose}
          className="w-full border border-gray-300 px-4 py-2 rounded text-gray-700 hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
