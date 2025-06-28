// src/components/AddToGroupModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createGroup } from '../requests';
import { useNavigate } from 'react-router-dom';

export default function AddToGroupModal({
  open,
  onClose,
  groups,
  selectedUserIds,
  onAdd // (groupId) => Promise
}) {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select'); // 'select' or 'create'
  const [groupId, setGroupId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setMode('select');
      setGroupId('');
      setNewName('');
      setNewDescription('');
      setCreating(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }
    setCreating(true);
    setError('');
    try {
      // Send name, optional description, and is_public=false
      const payload = {
        name: newName.trim(),
        description: newDescription.trim() || '', // optional
        is_public: false,
      };
      const res = await createGroup(payload);
      const createdGroup = res.data || res; // depending on your API wrapper
      const createdGroupId = createdGroup.id;

      // Automatically add selected users to that new group
      try {
        await onAdd(createdGroupId);
      } catch (addErr) {
        // If adding fails, you may choose to show an error but still redirect or not:
        console.error('Failed to add users to new group:', addErr);
        // We continue to redirect to the group page anyway:
      }
      // Close modal, then redirect
      onClose();
      navigate(`/groups/${createdGroupId}`);
    } catch (e) {
      console.error('Failed to create group:', e);
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleAddExisting = async () => {
    if (!groupId) return;
    try {
      await onAdd(groupId);
      onClose();
      navigate(`/groups/${groupId}`);
    } catch (e) {
      console.error('Failed to add users to group:', e);
      setError('Failed to add to group');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add {selectedUserIds.length}{' '}
            {selectedUserIds.length === 1 ? 'user' : 'users'} to a group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 py-2 text-center ${
              mode === 'select'
                ? 'border-b-2 border-purple-600 font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-center ${
              mode === 'create'
                ? 'border-b-2 border-purple-600 font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {mode === 'select' ? (
            <>
              <label
                htmlFor="group-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Choose a group
              </label>
              <select
                id="group-select"
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full py-2 pl-3 pr-10 text-sm rounded-md border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="" disabled>
                  Select group…
                </option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {error && mode === 'select' && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </>
          ) : (
            <>
              <label
                htmlFor="new-group-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New group name *
              </label>
              <input
                id="new-group-name"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Enter group name…"
              />
              <label
                htmlFor="new-group-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="new-group-description"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Enter an optional description…"
                rows={3}
              />
              {error && mode === 'create' && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          {mode === 'select' ? (
            <button
              disabled={!groupId}
              onClick={handleAddExisting}
              className={`px-4 py-2 rounded-md text-white transition focus:outline-none
                          focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                            groupId
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-purple-600 opacity-50 cursor-not-allowed'
                          }`}
            >
              Add
            </button>
          ) : (
            <button
              disabled={!newName.trim() || creating}
              onClick={handleCreate}
              className={`px-4 py-2 rounded-md text-white transition focus:outline-none
                          focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                            newName.trim() && !creating
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-purple-600 opacity-50 cursor-not-allowed'
                          }`}
            >
              {creating ? 'Creating…' : 'Create & Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
