import React, { useState } from 'react'
import { searchUsers } from '../requests'
import { X } from 'lucide-react'

export default function NewMessageModal({ isOpen, onClose, onUserSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim().length < 1) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await searchUsers(value)
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg p-6 rounded-xl shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <h2 className="text-xl font-semibold mb-5 text-gray-800 dark:text-white">
          Start a new conversation
        </h2>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search by display name or @username"
          className="w-full px-4 py-3 mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
        />

        {/* Results */}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Searching…</p>
        ) : (
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {results.map(user => (
              <li
                key={user.id}
                onClick={() => {
                  if (!user.has_thread) {
                    onUserSelect(user)
                    onClose()
                  }
                }}
                className={`flex items-center gap-4 px-4 py-2 rounded-lg transition
                  ${user.has_thread
                    ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}
                `}
              >
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover border dark:border-gray-600"
                />
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user.display_name || user.username}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </span>
                </div>
                {user.has_thread && (
                  <span className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                    In Inbox
                  </span>
                )}
              </li>
            ))}
            {!loading && results.length === 0 && query.length >= 1 && (
              <li className="text-sm text-gray-500 dark:text-gray-400 px-2">
                No users found
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
