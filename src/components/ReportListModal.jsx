// src/components/ReportListModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import api from '../api';
import { useNotification } from '../context/NotificationContext';

export default function ReportListModal({
  isOpen,
  onClose,
  contentType, // "post" | "listing" | "message"
  contentId,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const modalRef = useRef(null);
  const { showNotification } = useNotification();

  // Fetch all reports for this content
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api
      .get('/reports/', { params: { content_type: contentType, content_id: contentId } })
      .then((res) => {
        setReports(Array.isArray(res.data.results) ? res.data.results : []);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to load reports.', 'error');
      })
      .finally(() => setLoading(false));
  }, [isOpen, contentType, contentId]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose]);

  const handleDeleteContent = async () => {
    setActionLoading(true);
    try {
      // DELETE the content itself (depending on type)
      if (contentType === 'post') {
        await api.delete(`/posts/${contentId}/`);
      } else if (contentType === 'listing') {
        await api.delete(`/marketplace/${contentId}/delete/`);
      } else if (contentType === 'message') {
        await api.delete(`/messages/${contentId}/delete/`);
      }
      showNotification(`${capitalize(contentType)} deleted.`, 'success');

      // After deleting, also mark all reports as “handled”
      await api.post('/reports/handle/', {
        content_type: contentType,
        content_id: contentId,
        action: 'deleted',
      });

      onClose();
    } catch (err) {
      console.error(err);
      showNotification(`Failed to delete ${contentType}.`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId) => {
    setActionLoading(true);
    try {
      await api.post(`/reports/${reportId}/dismiss/`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      showNotification('Report dismissed.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to dismiss report.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-list-modal-title"
    >
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none" />

      <div
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 transition-transform duration-200 transform scale-100 pointer-events-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close report list modal"
        >
          <X size={20} />
        </button>

        <div className="px-6 pt-6 pb-4">
          <h2 id="report-list-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Reports for {capitalize(contentType)} #{contentId}
          </h2>

          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No reports found.</p>
          ) : (
            <ul className="space-y-4">
              {reports.map((report) => (
                <li key={report.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Reporter:</strong> {report.reported_by.username}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {e.stopPropagation() 
                          handleDismissReport(report.id) }}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {reports.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
            <button
              onClick={handleDeleteContent}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
            >
              {actionLoading ? 'Processing…' : `Delete ${capitalize(contentType)}`}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
