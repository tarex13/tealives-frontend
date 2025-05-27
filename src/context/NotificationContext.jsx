// src/context/NotificationContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef
} from 'react';
import api from '../api';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');

  // Notifications list
  const [notifications, setNotifications] = useState([]);

  // Fetch from REST, always normalize to an array
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('notifications/');
      const data = res.data;
      // data might be { results: [...] } or an array
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : [];
      setNotifications(list);
    } catch (err) {
      console.error('Fetch notifs failed', err);
    }
  }, []);

  // Mark one as read (REST + local)
  const markAsRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  // Toast helper
  const showNotification = (msg, type = 'info') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // WebSocket ref
  const ws = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // poll fallback every 30s
    const iv = setInterval(fetchNotifications, 30000);

    // setup WS
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws/notifications/?token=${
      localStorage.getItem('access')
    }`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onmessage = ({ data }) => {
      const newNotification = JSON.parse(data);
      setNotifications((prev) => [newNotification, ...prev]);
      showNotification(newNotification.content, 'info');
    };
    ws.current.onopen = () => console.log('Notifications WS connected');
    ws.current.onclose = () => console.log('Notifications WS disconnected');

    return () => {
      clearInterval(iv);
      if (ws.current) ws.current.close();
    };
  }, [fetchNotifications]);

  // Now that notifications is guaranteed to be an array, this is safe:
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotification,
        markAsRead,
      }}
    >
      {children}

      {/* In-page toast */}
      {toastMsg && (
        <div
          className={`fixed top-[9vh] right-4 p-3 rounded shadow-lg text-white transition-opacity ${
            toastType === 'error'
              ? 'bg-red-500'
              : toastType === 'success'
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
        >
          {toastMsg}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
