import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title = '', duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out"
        >
          {t.title}
        </div>
      ))}
    </div>
  );

  return { toast, ToastContainer };
}
