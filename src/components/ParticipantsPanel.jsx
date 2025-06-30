{/**Not being used */}
import React, { useState, useMemo } from 'react';
import { FaDownload, FaEnvelope, FaTrash } from 'react-icons/fa';

export default function ParticipantsPanel({
  participants,
  selectedUsers,
  onToggle,
  onRemove,
  onExport
}) {
  const [search, setSearch] = useState('');

  // filter participants by search term
  const filtered = useMemo(() => {
    return participants.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [participants, search]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every(u => selectedUsers.has(u.id));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Participants ({participants.length})
        </h3>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-1 pl-3 pr-8 text-sm rounded-md border border-gray-300 dark:border-gray-600
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
            <FaEnvelope
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
          </div>
          <button
            onClick={onExport}
            className="flex items-center space-x-1 text-sm font-medium text-teal-600 dark:text-teal-400
                       hover:text-teal-800 dark:hover:text-teal-200 transition"
          >
            <FaDownload />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => {
                    const next = e.target.checked;
                    filtered.forEach(u => {
                      if (selectedUsers.has(u.id) !== next) {
                        onToggle(u.id);
                      }
                    });
                  }}
                  className="form-checkbox h-4 w-4 text-teal-600 dark:text-teal-400"
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(u => {
              const isSelected = selectedUsers.has(u.id);
              return (
                <tr
                  key={u.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(u.id)}
                      className="form-checkbox h-4 w-4 text-teal-600 dark:text-teal-400"
                    />
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-3">
                    {u.profile_image ? (
                      <img
                        src={u.profile_image}
                        alt={u.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <a
                      href={`/profile/${u.username}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:underline transition"
                    >
                      {u.username}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => window.location.href = `/inbox?to=${u.id}`}
                      className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium
                                 text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400
                                 rounded hover:bg-teal-100 dark:hover:bg-teal-800 transition"
                    >
                      <FaEnvelope className="h-3 w-3" />
                      <span>Contact</span>
                    </button>
                    <button
                      onClick={() => onRemove(u.id)}
                      className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium
                                 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400
                                 rounded hover:bg-red-100 dark:hover:bg-red-700 transition"
                    >
                      <FaTrash className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
