// src/components/Modal.jsx
import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent scrolling behind the modal when it’s open:
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto relative">
        {/* Header with Title & Close Button */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {/* Body */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
