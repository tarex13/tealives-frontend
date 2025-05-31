// src/components/ReportModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  ShieldAlert,
  ThumbsDown,
  HelpCircle,
  Flag,
} from 'lucide-react';
import api from '../api';

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const presetReasons = [
  { label: 'Spam', icon: <Flag className="w-4 h-4 text-red-500" /> },
  { label: 'Harassment', icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
  { label: 'Inappropriate Content', icon: <ThumbsDown className="w-4 h-4 text-red-500" /> },
  { label: 'Other', icon: <HelpCircle className="w-4 h-4 text-red-500" /> }
];

const WORD_LIMIT = 100;

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  onSuccess
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);

  const trimmedReason = customReason.trim();
  const wordCount = trimmedReason.split(/\s+/).filter(Boolean).length;
  const exceedsLimit = wordCount > WORD_LIMIT;

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setTimeout(() => {
          onClose();
        }, 0);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedReason, customReason]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a report type.');
      return;
    }
    if (!trimmedReason) {
      setError('Please enter a description.');
      return;
    }
    if (exceedsLimit) {
      setError(`Reason exceeds the ${WORD_LIMIT}-word limit.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/report/', {
        content_type: contentType,
        content_id: contentId,
        reason: `${selectedReason}: ${trimmedReason}`
      });
      setSubmitted(true);
      setSelectedReason('');
      setCustomReason('');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Could not submit report.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSubmitted(false);
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="report-modal-title"
    >
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none" />

      <div
        ref={modalRef}
        onMouseDown={e => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 transition-transform duration-200 transform scale-100 pointer-events-auto"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close report modal"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Thank you!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your report has been submitted.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2
                id="report-modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4"
              >
                Report {capitalize(contentType)}
              </h2>

              <div className="space-y-3 mb-4">
                {presetReasons.map(({ label, icon }) => (
                  <label
                    key={label}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={label}
                      checked={selectedReason === label}
                      onChange={() => setSelectedReason(label)}
                      className="accent-red-600"
                    />
                    {icon}
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <label
                  htmlFor="report-custom-reason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Please describe your report
                </label>
                <textarea
                  ref={textareaRef}
                  id="report-custom-reason"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Provide more context (required)..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  disabled={loading}
                />
                <div className="text-xs text-right mt-1">
                  <span className={exceedsLimit ? 'text-red-600' : 'text-gray-500'}>
                    {wordCount}/{WORD_LIMIT} words
                  </span>
                </div>
              </div>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
