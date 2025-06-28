// src/context/NotificationContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { createWebSocket } from '../utils/websocket';
import api from '../api';
import { useAuth } from '../context/AuthContext';
const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
      const { user } = useAuth();
  // track whether WS ever successfully opened
  const [wsConnected, setWsConnected] = useState(false);
  // keep our poll interval ID
  const pollRef = useRef(null);
  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');

  // Notifications list
  const [notifications, setNotifications] = useState([]);

  // Fetch from REST, always normalize to an array
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
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

  }, [user]);

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
    setTimeout(() => setToastMsg(''), 7000);
  };

  // WebSocket ref
  const ws = useRef(null);

useEffect(() => {
  if (!user) return;

  fetchNotifications(); // Initial: always get latest

  // If WS never connects, we'll start polling:
  const startPolling = () => {
    if (!pollRef.current) {
      pollRef.current = setInterval(fetchNotifications, 10000);
    }
  };

  const token = localStorage.getItem('accessToken');
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname; // auto match localhost/production
  const port = '8000'; // match Daphne
  const socketUrl = `${protocol}://${host}:${port}/ws/notifications/?token=${token}`;

  if (!token) {
    console.warn('WebSocket not connected: missing token');
    return;
  }

  const socket = createWebSocket('/ws/notifications/', token);
  ws.current = socket;

  socket.onopen = () => {
    setWsConnected(true);
    // stop any fallback polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // refresh once in case we missed any
    fetchNotifications();
  };

  socket.onmessage = ({ data }) => {
    const newNotification = JSON.parse(data);
    setNotifications((prev) => [newNotification, ...prev]);
    showNotification(newNotification.content, 'info');
  };

  socket.onclose = (e) => {
    console.log('Notifications WS disconnected', e);
    // if we never got a successful open, fallback to polling
    if (!wsConnected) { startPolling(); }
  };

  socket.onerror = (e) => {
    console.error('WebSocket error', e);
  };

  return () => {
    // teardown polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
  };
}, [user]); // Only depend on `user`


  // Now that notifications is guaranteed to be an array, this is safe:
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotification,
        markAsRead,
        reloadNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* In-page toast */}
      {toastMsg && (
        <div
          className={`fixed top-20 right-4 p-3 rounded shadow-lg text-white transition-opacity ${
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
