import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { setUpdateAccessTokenCallback } from './AuthContextHelper';

const AuthContext = createContext();
let refreshTimeoutId = null;
const BUFFER_TIME_MS = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (accessToken) => {
    try {
      const res = await api.get('user/profile/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err.response || err);
      return null;
    }
  };

  const loginUser = async ({ access }) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('hasLoggedIn', 'true'); // ✅ Mark login for refresh cookie check

    const profile = await fetchUserProfile(access);
    if (profile) {
      setUser(profile);
      scheduleSilentRefresh(access);
    } else {
      await logoutUser({ redirect: false });
    }
  };

  const logoutUser = async ({ redirect = true } = {}) => {
    clearStoredAuth();
    localStorage.setItem('sidebarOpen', false)
    setUser(null);

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    try {
      await api.post('logout/'); // Safe logout view with refresh token handling
    } catch (err) {
      console.warn('[AuthContext] Logout API failed:', err.response || err);
    }

    if (redirect) {
      window.location.href = '/user/auth/';
    }
  };

  const refreshAccessToken = async () => {
    try {
      const res = await api.post('token/refresh/', {}, { withCredentials: true });
      const { access } = res.data;
      localStorage.setItem('accessToken', access);

      const profile = await fetchUserProfile(access);
      if (profile) {
        setUser(profile);
        scheduleSilentRefresh(access);
      } else {
        console.warn('[AuthContext] Silent refresh: profile fetch failed.');
        localStorage.removeItem('accessToken');
        setUser(null);
      }

      return access;
    }   catch (err) {
      console.error('[AuthContext] Token refresh failed:', err.response || err);
      clearStoredAuth();
      setUser(null);
      // Add this line:
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
  
      return null;
    }
  };
  const clearStoredAuth = () => {
    ['accessToken', 'hasLoggedIn', 'userToken', 'user'].forEach(key =>
      localStorage.removeItem(key)
    );
    localStorage.setItem('sidebarOpen', 'false')
  };
  const updateAccessToken = async () => {
    await refreshAccessToken();
  };

  const scheduleSilentRefresh = (accessToken) => {
    if (!accessToken) return;

    let decoded;
    try {
      decoded = jwtDecode(accessToken);
    } catch (e) {
      console.error('[AuthContext] Failed to decode access token.');
      clearStoredAuth();
      setUser(null);
      return;
    }

    const expiresAt = decoded.exp * 1000;
    const delay = expiresAt - Date.now() - BUFFER_TIME_MS;

    if (delay <= 0 || isNaN(delay)) {
      refreshAccessToken(); // Immediate refresh if expired or invalid
      return;
    }

    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    refreshTimeoutId = setTimeout(() => {
      refreshAccessToken();
    }, delay);
  };

  useEffect(() => {
    setUpdateAccessTokenCallback(updateAccessToken);

    const tryLoad = async () => {
      const access = localStorage.getItem('accessToken');
      const hasLoggedIn = localStorage.getItem('hasLoggedIn') === 'true';

      if (access) {
        const profile = await fetchUserProfile(access);
        if (profile) {
          setUser(profile);
          scheduleSilentRefresh(access);
        } else if (hasLoggedIn) {
          await refreshAccessToken();
        }
      } else if (hasLoggedIn) {
        // Attempt refresh if user has logged in before
        await refreshAccessToken();
      }

      setLoading(false);
    };

    tryLoad();

    return () => {
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, updateAccessToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
