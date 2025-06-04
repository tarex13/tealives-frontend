// src/components/InviteMembers.jsx
import React, { useState } from 'react';
import { inviteMembers } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useParams } from 'react-router-dom';

export default function InviteMembers() {
  const { groupId } = useParams();
  const [usernames, setUsernames] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleAddUsername = () => {
    const trimmed = currentInput.trim();
    if (trimmed && !usernames.includes(trimmed)) {
      setUsernames((prev) => [...prev, trimmed]);
    }
    setCurrentInput('');
  };

  const handleRemoveUsername = (name) => {
    setUsernames((prev) => prev.filter((u) => u !== name));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUsername();
    }
  };

  const handleInvite = async () => {
    if (usernames.length === 0) {
      showNotification('Please enter at least one username.', 'error');
      return;
    }

    setLoading(true);
    try {
      await inviteMembers(groupId, usernames);
      showNotification('Members invited successfully!', 'success');
      setUsernames([]);
      setCurrentInput('');
    } catch {
      showNotification('Failed to invite members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Invite Members
      </h2>

      <div className="mb-4">
        <label
          htmlFor="username-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Enter Username
        </label>
        <input
          id="username-input"
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a username and press Enter"
          className="
            w-full
            px-3
            py-2
            border
            border-gray-300
            dark:border-gray-600
            rounded-md
            bg-white
            dark:bg-gray-700
            text-gray-800
            dark:text-gray-100
            focus:outline-none
            focus:ring-2
            focus:ring-blue-400
          "
        />
      </div>

      {usernames.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Added Usernames:
          </p>
          <div className="flex flex-wrap gap-2">
            {usernames.map((name) => (
              <span
                key={name}
                className="
                  flex items-center
                  px-3 py-1
                  bg-blue-100 dark:bg-blue-700
                  text-blue-800 dark:text-blue-100
                  rounded-full
                "
              >
                <span className="truncate max-w-xs">{name}</span>
                <button
                  onClick={() => handleRemoveUsername(name)}
                  className="
                    ml-2
                    text-blue-800 dark:text-blue-100
                    hover:text-red-600 dark:hover:text-red-400
                    focus:outline-none
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleInvite}
        disabled={loading}
        className={`
          w-full
          py-2
          rounded-md
          text-white
          text-lg
          font-medium
          transition
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-blue-400
          ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
      >
        {loading ? 'Inviting…' : 'Invite Members'}
      </button>
    </div>
  );
}
