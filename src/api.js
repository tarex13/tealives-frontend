// src/api.js
import axios from 'axios';
import { getUpdateAccessTokenCallback } from './context/AuthContextHelper';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
  withCredentials: true,  // send cookies (including refresh token) on every request
});

// Attach the Bearer access token automatically
api.interceptors.request.use(
  config => {
    const access = localStorage.getItem('accessToken');
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
      console.log('[api] Attached access token');
    }
     config.headers['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';
    return config;
  },
  error => Promise.reject(error)
);

// On 401/token_not_valid, do one silent refresh then retry original request
api.interceptors.response.use(
  response => response,
  async error => {
    const origReq = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'token_not_valid' &&
      !origReq._retry
    ) {
      origReq._retry = true;
      try {
        // Use our api instance so withCredentials + baseURL apply
        const { data } = await api.post('token/refresh/', {});
        const { access } = data;

        // Persist new access token
        localStorage.setItem('accessToken', access);

        // Let AuthContext know so it can reschedule the next silent refresh
        const cb = getUpdateAccessTokenCallback();
        if (cb) cb();

        // Retry original request with new token
        origReq.headers.Authorization = `Bearer ${access}`;
        origReq.headers['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';
        return api(origReq);
      } catch (refreshErr) {
        console.error('[api] Refresh failed:', refreshErr);
        localStorage.removeItem('accessToken');
        window.location.href = '/user/auth/';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
