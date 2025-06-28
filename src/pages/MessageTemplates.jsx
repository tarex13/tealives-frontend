{/*Not Being Used Yet*/}

import React, { useEffect, useState } from 'react';
import {
  listMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
} from '../requests';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MessageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await listMessageTemplates();
      setTemplates(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMessageTemplate(editing.id, formData);
        setEditing(null);
      } else {
        await createMessageTemplate(formData);
      }
      setShowForm(false);
      setFormData({ title: '', content: '' });
      loadTemplates();
    } catch (err) {
      console.error('Save template failed:', err);
      alert('Error saving template.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deleteMessageTemplate(id);
      loadTemplates();
    } catch (err) {
      console.error('Delete template failed:', err);
    }
  };

  const openNewForm = () => {
    setEditing(null);
    setFormData({ title: '', content: '' });
    setShowForm(true);
  };

  const openEditForm = (tpl) => {
    setEditing(tpl);
    setFormData({ title: tpl.title, content: tpl.content });
    setShowForm(true);
  };

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Message Templates</h2>
        <button
          onClick={openNewForm}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + New Template
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-4"
        >
          <div>
            <label
              htmlFor="template-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Title
            </label>
            <input
              id="template-title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="template-content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Content
            </label>
            <textarea
              id="template-content"
              rows={4}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setFormData({ title: '', content: '' });
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No templates yet.</p>
      ) : (
        <ul className="space-y-4">
          {templates.map((tpl) => (
            <li
              key={tpl.id}
              className="bg-white dark:bg-gray-800 p-4 rounded shadow flex justify-between items-start"
            >
              <div className="pr-4 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {tpl.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 whitespace-pre-line">
                  {tpl.content}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(tpl)}
                  className="text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900 p-1 rounded transition"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded transition"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
