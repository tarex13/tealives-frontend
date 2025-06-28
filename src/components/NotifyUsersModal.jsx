import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function NotifyUsersModal({ open, onClose, selectedUserIds, onNotify }) {
  const [message, setMessage] = useState('');

  // Reset message when modal opens/closes
  useEffect(() => {
    if (!open) setMessage('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50
                 p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      {/* stopPropagation so clicking inside doesn’t close */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden
                   max-w-lg w-full mx-auto transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notify {selectedUserIds.length} user{selectedUserIds.length !== 1 && 's'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <label htmlFor="notify-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="notify-message"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here…"
            className="w-full resize-none rounded-md border border-gray-300 dark:border-gray-600
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400
                       dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500
                       focus:border-teal-500 transition"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            disabled={!message.trim()}
            onClick={() => onNotify(message.trim())}
            className={`px-4 py-2 rounded-md text-white transition focus:outline-none
                        focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                        ${
                          message.trim()
                            ? 'bg-teal-600 hover:bg-teal-700'
                            : 'bg-teal-600 opacity-50 cursor-not-allowed'
                        }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
