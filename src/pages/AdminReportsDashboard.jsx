// src/pages/AdminReportsDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNotification } from '../context/NotificationContext';
import { Trash2, UserX, AlertCircle } from 'lucide-react';

export default function AdminReportsDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/');
      setReports(res.data.results);
    } catch {
      showNotification('Could not fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

const handleAction = async (id, action) => {
  const confirmed = window.confirm(`Are you sure you want to perform "${action}" on report #${id}?`);
  if (!confirmed) return;

  try {
    await api.patch(`/report/${id}/`, { action });
    showNotification(`Action "${action}" successful`, 'success');
    load();
  } catch {
    showNotification('Action failed', 'error');
  }
};

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Reported Content</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="animate-spin h-6 w-6 text-gray-500 mr-2" />
          <span className="text-gray-500">Loading reports…</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-3" />
          <p className="text-lg">No pending reports.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(r => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition p-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">
                      {r.content_type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      #{r.content_id}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reported by{' '}
                    <span className="font-medium">@{r.reported_by.username}</span>{' '}
                    on{' '}
                    <time dateTime={r.created_at}>
                      {new Date(r.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })}
                    </time>
                  </p>
                </div>

                <div className="flex space-x-2">
                  {r.content_type === 'user' ? (
                    <button
                      onClick={() => handleAction(r.id, 'suspend')}
                      className="inline-flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(r.id, 'delete')}
                      className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm">
                  <strong>Reason:</strong> {r.reason}
                </p>
                {r.content_snippet && (
                  <blockquote className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 italic">
                    “…{r.content_snippet}…”
                  </blockquote>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
