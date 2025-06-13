// src/pages/AdminReportsDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Trash2,
  UserX,
  AlertCircle,
  MessageCircle,
  Eye,
  Users,
  Filter,
  Search,
  CheckSquare,
  Archive,
  Activity,
} from 'lucide-react';

/**
 * AdminReportsDashboard
 */
export default function AdminReportsDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Redirect if not a moderator/admin
  const [currentModeratorId, setCurrentModeratorId] = useState(null);
  useEffect(() => {
    if (!user || (!user.is_moderator && !user.is_admin)) {
      navigate('/');
    } else {
      setCurrentModeratorId(user.id);
    }
  }, [user, navigate]);

  // State
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    total_pending: 0,
    by_reason: { spam: 0, harass: 0, inapprop: 0, other: 0 },
    avg_resolution_hours: 0,
    received_today: 0,
    received_week: 0,
  });
  const [filters, setFilters] = useState({
    contentType: 'all',
    reason: 'all',
    status: 'pending',
    assignedTo: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [previewReport, setPreviewReport] = useState(null);
  const [messageReport, setMessageReport] = useState(null);
  const [notesReport, setNotesReport] = useState(null);

  // Fetch summary metrics
  const loadSummary = async () => {
    try {
      const res = await api.get('/reports/metrics/');
      // res.data is { total_pending, by_reason, avg_resolution_hours, received_today, received_week }
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load dashboard metrics.', 'error');
    }
  };

  // Fetch filtered, paginated reports
  const loadReports = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        status: filters.status !== 'all' ? filters.status : undefined,
        content_type: filters.contentType !== 'all' ? filters.contentType : undefined,
        reason: filters.reason !== 'all' ? filters.reason : undefined,
        assigned_to:
          filters.assignedTo === 'me'
            ? currentModeratorId
            : filters.assignedTo === 'unassigned'
            ? 'none'
            : undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        search: searchTerm || undefined,
      };
      const res = await api.get('/reports/', { params });
      // res.data is { results: [...], count: N, … }
      setReports(res.data.results);
      setTotalPages(Math.ceil(res.data.count / pageSize));
    } catch (err) {
      console.error(err);
      showNotification('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load & reload on filters/search/page change
  useEffect(() => {
    if (currentModeratorId !== null) {
      loadSummary();
      loadReports();
    }
  }, [filters, searchTerm, page, currentModeratorId]);

  // Handlers for filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Pagination
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  // Quick‐action handlers
  const assignToMe = async (reportId) => {
    try {
      await api.post(`/reports/${reportId}/assign/`, { moderator_id: currentModeratorId });
      showNotification('Assigned to you.', 'success');
      loadReports();
    } catch (err) {
      console.error(err);
      showNotification('Failed to assign.', 'error');
    }
  };

  const handleAction = async (reportId, actionType) => {
    const confirmMsg = {
      delete: 'Delete content?',
      suspend: 'Suspend user account?',
      dismiss: 'Dismiss report?',
      escalate: 'Escalate to senior?',
    }[actionType] || `Perform "${actionType}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/reports/${reportId}/`, { action: actionType });
      showNotification(`"${actionType}" successful.`, 'success');
      loadSummary();
      loadReports();
    } catch (err) {
      console.error(err);
      showNotification(`Action "${actionType}" failed.`, 'error');
    }
  };

  // Send moderator message
  const sendMessage = async (reportId, subject, content) => {
    try {
      await api.post(`/reports/${reportId}/message/`, { subject, content });
      showNotification('Message sent to user.', 'success');
      setMessageReport(null);
    } catch (err) {
      console.error(err);
      showNotification('Failed to send message.', 'error');
    }
  };

  // Bulk action on selected reports
  const [selectedReports, setSelectedReports] = useState(new Set());
  const toggleSelectReport = (id) => {
    setSelectedReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  const clearSelection = () => setSelectedReports(new Set());
  const bulkAction = async (actionType) => {
    if (selectedReports.size === 0) return;
    const confirmMsg = `Apply "${actionType}" to ${selectedReports.size} selected?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post('/reports/bulk_action/', {
        report_ids: Array.from(selectedReports),
        action: actionType,
      });
      showNotification(`Bulk action "${actionType}" successful.`, 'success');
      clearSelection();
      loadSummary();
      loadReports();
    } catch (err) {
      console.error(err);
      showNotification(`Bulk action "${actionType}" failed.`, 'error');
    }
  };

  // Memoized arrays for dropdowns
  const contentTypes = useMemo(
    () => ['all', 'post', 'comment', 'marketplaceitem', 'message', 'user', 'group'],
    []
  );
  const statuses = useMemo(
    () => ['all', 'pending', 'in_review', 'actioned', 'dismissed', 'escalated'],
    []
  );
  const reasons = useMemo(() => ['all', 'spam', 'harassment', 'inapprop', 'other'], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={loadSummary}
            className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            <Activity className="w-4 h-4 mr-1" />
            Refresh Metrics
          </button>
          <button
            onClick={loadReports}
            className="inline-flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            <Activity className="w-4 h-4 mr-1" />
            Refresh Reports
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Pending Reports</p>
            <p className="text-2xl font-semibold">{summary.total_pending}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
          <Filter className="w-6 h-6 text-yellow-500 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Spam Reports</p>
            <p className="text-2xl font-semibold">{summary.by_reason.spam}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
          <Users className="w-6 h-6 text-indigo-500 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Average Resolution</p>
            <p className="text-2xl font-semibold">{summary.avg_resolution_hours}h</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
          <Archive className="w-6 h-6 text-green-500 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Received This Week</p>
            <p className="text-2xl font-semibold">{summary.received_week}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content Type
            </label>
            <select
              name="contentType"
              value={filters.contentType}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            >
              {contentTypes.map((ct) => (
                <option key={ct} value={ct}>
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason
            </label>
            <select
              name="reason"
              value={filters.reason}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assigned
            </label>
            <select
              name="assignedTo"
              value={filters.assignedTo}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="me">Assigned to Me</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleDateChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleDateChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search reason, reporter, content snippet…"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <button
            onClick={() => bulkAction('dismiss')}
            disabled={selectedReports.size === 0}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Dismiss Selected
          </button>
          <button
            onClick={() => bulkAction('delete')}
            disabled={selectedReports.size === 0}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Delete Content
          </button>
          <button
            onClick={() => bulkAction('escalate')}
            disabled={selectedReports.size === 0}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Escalate Selected
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="animate-spin h-6 w-6 text-gray-500 mr-2" />
            <span className="text-gray-500">Loading reports…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-3" />
            <p className="text-lg">No reports found.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                isSelected={selectedReports.has(r.id)}
                toggleSelect={toggleSelectReport}
                onAssign={() => assignToMe(r.id)}
                onAction={handleAction}
                onPreview={() => setPreviewReport(r)}
                onMessage={() => setMessageReport(r)}
                onNotes={() => setNotesReport(r)}
                currentModeratorId={currentModeratorId}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 py-4">
          <button
            onClick={goToPrevPage}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <PreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}

      {/* Message Modal */}
      {messageReport && (
        <MessageModal
          report={messageReport}
          onClose={() => setMessageReport(null)}
          sendMessage={sendMessage}
        />
      )}

      {/* Notes Modal */}
      {notesReport && (
        <NotesModal
          report={notesReport}
          onClose={() => setNotesReport(null)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

/**
 * ReportCard
 */
function ReportCard({
  report,
  isSelected,
  toggleSelect,
  onAssign,
  onAction,
  onPreview,
  onMessage,
  onNotes,
  currentModeratorId,
}) {
  // Safely extract fields (some may be missing)
  const {
    id,
    content_type_read,
    content_id_read,
    reported_by,
    created_at,
    reason,
    content_snippet,
    priority_score,
    assigned_to,
  } = report;

  // Determine display values with fallbacks
  const contentTypeLabel = content_type_read ? content_type_read.toUpperCase() : 'UNKNOWN';
  const contentIdLabel = content_id_read != null ? `#${content_id_read}` : '';
  const reporterName =
    reported_by && typeof reported_by === 'object' && reported_by.username
      ? reported_by.username
      : reported_by; // could be an ID or undefined

  const isUserReport = content_type_read === 'user';
  const isAssignedToMe = assigned_to && currentModeratorId === assigned_to.id;

  return (
    <li className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 relative">
      {/* Bulk Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelect(id)}
        className="absolute top-4 left-4 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />

      {/* Top Row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
            {contentTypeLabel} {contentIdLabel}
          </span>
          {assigned_to && assigned_to.username ? (
            <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded">
              Assigned to @{assigned_to.username}
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded">
              Unassigned
            </span>
          )}
        </div>
        <div className="flex space-x-1 text-gray-500 dark:text-gray-400 text-sm">
          <Users className="w-4 h-4" />
          <span>@{reporterName || 'Unknown'}</span>
          <span>·</span>
          <time dateTime={created_at}>
            {created_at
              ? new Date(created_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })
              : ''}
          </time>
        </div>
      </div>

      {/* Reason & Snippet */}
      <div className="mt-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Reason:</strong> {reason || '—'}
        </p>
        {content_snippet && (
          <blockquote className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 italic">
            “…{content_snippet}…”
          </blockquote>
        )}
      </div>

      {/* Priority Score */}
      {priority_score != null && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <strong>Priority:</strong> {priority_score}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Preview Content */}
        <button
          onClick={onPreview}
          className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs"
        >
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </button>

        {/* Assign to Me */}
        {!assigned_to && (
          <button
            onClick={onAssign}
            className="inline-flex items-center px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs"
          >
            <Users className="w-4 h-4 mr-1" />
            Assign to Me
          </button>
        )}

        {/* In-Review indicator */}
        {assigned_to && !isAssignedToMe && assigned_to.username && (
          <button
            disabled
            className="inline-flex items-center px-3 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed"
          >
            In Review by @{assigned_to.username}
          </button>
        )}

        {/* Dismiss Report */}
        <button
          onClick={() => onAction(id, 'dismiss')}
          className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs"
        >
          <Archive className="w-4 h-4 mr-1" />
          Dismiss
        </button>

        {/* Delete Content / Suspend User */}
        {isUserReport ? (
          <button
            onClick={() => onAction(id, 'suspend')}
            className="inline-flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
          >
            <UserX className="w-4 h-4 mr-1" />
            Suspend
          </button>
        ) : (
          <button
            onClick={() => onAction(id, 'delete')}
            className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        )}

        {/* Send Message */}
        <button
          onClick={onMessage}
          className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </button>

        {/* Escalate */}
        <button
          onClick={() => onAction(id, 'escalate')}
          className="inline-flex items-center px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs"
        >
          <AlertCircle className="w-4 h-4 mr-1" />
          Escalate
        </button>

        {/* Internal Notes */}
        <button
          onClick={onNotes}
          className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs"
        >
          <Archive className="w-4 h-4 mr-1" />
          Notes
        </button>
      </div>
    </li>
  );
}

/**
 * PreviewModal
 *
 * Shows the full content for a given report.
 * Fetches reported content (post, marketplaceitem, message, user, comment, group) via API.
 */
function PreviewModal({ report, onClose }) {
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        switch (report.content_type_read) {
          case 'post':
            endpoint = `/posts/${report.content_id_read}/`;
            break;
          case 'marketplaceitem':
            endpoint = `/marketplace/${report.content_id_read}/`;
            break;
          case 'message':
            endpoint = `/messages/${report.content_id_read}/`;
            break;
          case 'user':
            endpoint = `/users/${report.content_id_read}/`;
            break;
          case 'comment':
            endpoint = `/comments/${report.content_id_read}/`;
            break;
          case 'group':
            endpoint = `/groups/${report.content_id_read}/`;
            break;
          default:
            endpoint = '';
        }
        if (!endpoint) throw new Error('Unknown content type');
        const res = await api.get(endpoint);
        setContentData(res.data);
      } catch (err) {
        console.error(err);
        showNotification('Failed to load content preview.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [report, showNotification]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close preview"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Content Preview
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="animate-spin h-6 w-6 text-gray-500 mr-2" />
            <span className="text-gray-500">Loading content…</span>
          </div>
        ) : !contentData ? (
          <p className="text-center text-gray-500">Unable to display content.</p>
        ) : (
          <div className="prose dark:prose-dark max-w-none">
            {/* ─── POST ─── */}
            {report.content_type_read === 'post' && (
              <>
                {/* If the post belongs to a group, show the group name */}
                {contentData.group_info ? (
                  <p className="text-sm text-gray-500 mb-2">
                    Posted in group: <strong>{contentData.group_info.name}</strong>
                  </p>
                ) : null}

                {/* If there is a username (regular post), show author */}
                {contentData.username && (
                  <p className="text-sm text-gray-500 mb-2">
                    By @{contentData.username}
                  </p>
                )}

                {/* Title */}
                {contentData.title && (
                  <h3 className="font-semibold text-lg">{contentData.title}</h3>
                )}

                {/* Body/content */}
                {contentData.content && (
                  <p className="mt-2">{contentData.content}</p>
                )}

                {/* Any media / images if your API returns them */}
                {Array.isArray(contentData.media_files) &&
                  contentData.media_files.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {contentData.media_files.map((imgUrl) => (
                        <img
                          key={imgUrl}
                          src={imgUrl}
                          alt="Post media"
                          className="w-full rounded"
                        />
                      ))}
                    </div>
                  )}
              </>
            )}

            {/* ─── MARKETPLACEITEM ─── */}
            {report.content_type_read === 'marketplaceitem' && (
              <>
                <h3 className="font-semibold">{contentData.title}</h3>
                <p className="mt-2">{contentData.description}</p>
                {typeof contentData.price === 'number' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Price: ${contentData.price}
                  </p>
                )}
                {Array.isArray(contentData.images) && contentData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {contentData.images.map((imgUrl) => (
                      <img
                        key={imgUrl}
                        src={imgUrl}
                        alt="Listing media"
                        className="w-full rounded"
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ─── MESSAGE ─── */}
            {report.content_type_read === 'message' && (
              <>
                <p className="text-sm text-gray-500 mb-2">
                  From @{contentData.sender?.username || 'Unknown'} to @
                  {contentData.recipient?.username || 'Unknown'}
                </p>
                <p className="mt-2">{contentData.content}</p>
              </>
            )}

            {/* ─── USER ─── */}
            {report.content_type_read === 'user' && (
              <>
                <h3 className="font-semibold">User Profile: @{contentData.username}</h3>
                {contentData.date_joined && (
                  <p className="mt-2">
                    Joined: {new Date(contentData.date_joined).toLocaleDateString()}
                  </p>
                )}
                {typeof contentData.reputation === 'number' && (
                  <p className="mt-1">Reputation: {contentData.reputation}</p>
                )}
                {contentData.bio && <p className="mt-2">{contentData.bio}</p>}
              </>
            )}

            {/* ─── COMMENT ─── */}
            {report.content_type_read === 'comment' && (
              <>
                <h3 className="font-semibold">Comment</h3>
                <p className="mt-2">{contentData.content}</p>
                {contentData.post_id && (
                  <p className="mt-1 text-xs text-gray-500">On post #{contentData.post_id}</p>
                )}
              </>
            )}

            {/* ─── GROUP ─── */}
            {report.content_type_read === 'group' && (
              <>
                <h3 className="font-semibold">Group: {contentData.name}</h3>
                {contentData.description && <p className="mt-2">{contentData.description}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MessageModal
 */
function MessageModal({ report, onClose, sendMessage }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { showNotification } = useNotification();

  // Example templates
  const templates = [
    {
      id: 'none',
      label: 'None',
      subject: '',
      body:
        "",
    },
    {
      id: 'warn_harassment',
      label: 'Harassment Warning',
      subject: 'Warning: Harassment Policy Violation',
      body:
        "Hello {{username}},\n\nWe reviewed your recent content and found it violates our Harassment Policy. Please refrain from using insulting or threatening language. Continued violations may result in suspension.\n\nThank you,\nCommunity Team",
    },
    {
      id: 'remove_listing',
      label: 'Listing Removed Notice',
      subject: 'Notice: Your Listing Was Removed',
      body:
        "Hello {{username}},\n\nYour listing #{{content_id}} was removed because it contravenes our Marketplace Policy on prohibited items. If you believe this was a mistake, please reply with more details.\n\nThank you,\nCommunity Team",
    },
    {
      id: 'account_suspension',
      label: 'Account Suspension Notice',
      subject: 'Account Suspended',
      body:
        "Hello {{username}},\n\nYour account has been suspended for 7 days due to repeated policy violations. During this period, you will not be able to post or message. If you have questions, please reply here.\n\nThank you,\nCommunity Team",
    },
  ];

  // Apply template
  const applyTemplate = (tplId) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    let subj = tpl.subject;
    let body = tpl.body;
    const reporterName =
      report.reported_by && report.reported_by.username
        ? report.reported_by.username
        : report.reported_by;
    subj = subj
      .replace('{{username}}', reporterName)
      .replace('{{content_id}}', report.content_id_read);
    body = body
      .replace(/{{username}}/g, reporterName)
      .replace(/{{content_id}}/g, report.content_id_read);
    setSubject(subj);
    setContent(body);
  };

  const handleSend = () => {
    if (!content.trim()) {
      showNotification('Message body cannot be empty.', 'error');
      return;
    }
    sendMessage(report.id, subject, content);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close message modal"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Send Message to @{(report.reported_by && report.reported_by.username) || report.reported_by}
        </h2>

        {/* Template Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Choose Template (optional)
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              applyTemplate(e.target.value);
            }}
            className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject (optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Message Body */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here…"
            className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Send Button */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * NotesModal
 */
function NotesModal({ report, onClose, showNotification }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/${report.id}/notes/`);
        setNotes(res.data);
      } catch (err) {
        console.error(err);
        showNotification('Failed to load notes.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [report, showNotification]);

  const addNote = async () => {
    if (!newNote.trim()) {
      showNotification('Note cannot be empty.', 'error');
      return;
    }
    try {
      const res = await api.post(`/reports/${report.id}/notes/`, { content: newNote });
      setNotes((prev) => [...prev, res.data]);
      setNewNote('');
      showNotification('Note added.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to add note.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close notes modal"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Internal Notes for Report #{report.id}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Activity className="animate-spin h-6 w-6 text-gray-500 mr-2" />
            <span className="text-gray-500">Loading notes…</span>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
            {notes.length === 0 ? (
              <p className="text-gray-500">No notes yet.</p>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-gray-200 dark:border-gray-700 pb-2"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(n.created_at).toLocaleString()} by @{n.moderator.username}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{n.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add New Note */}
        <div className="mb-4">
          <textarea
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new internal note…"
            className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={addNote}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
