import React, { createContext, useContext, useEffect, useState } from 'react';
// ─── Fix: import default, not named ───────────────────────────────────────────
import {jwtDecode} from 'jwt-decode';
import api from '../api';
import { setUpdateAccessTokenCallback } from './AuthContextHelper';

const AuthContext = createContext();
let refreshTimeoutId = null;
const BUFFER_TIME_MS = 60 * 1000; // 1 minute before expiry

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── fetchUserProfile: GET /user/profile/ using the access token ─────────────
  const fetchUserProfile = async (accessToken) => {
    try {
      const res = await api.get('user/profile/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        '[AuthContext] Failed to fetch user profile:',
        err.response?.data?.detail || err.message
      );
      return null;
    }
  };

  // ─── loginUser: POST credentials to /api/token-login/ to retrieve { access, refresh } ─
  //     and set the HttpOnly refresh_token cookie automatically.
  const loginUser = async ({ username, password }) => {
    try {
      // 1️⃣ POST /api/token-login/ with user credentials
      // (NOTE: use the correct endpoint name from your urlpatterns)
      const response = await api.post('token-login/', { username, password });

      // response.data should be { access: "...", refresh: "..." }
      const { access } = response.data;
      if (!access) {
        throw new Error('No access token returned');
      }

      // 2️⃣ Save the access token in localStorage
      localStorage.setItem('accessToken', access);
      localStorage.setItem('hasLoggedIn', 'true');

      // 3️⃣ Fetch and set the user profile
      const profile = await fetchUserProfile(access);
      if (profile) {
        setUser(profile);
        scheduleSilentRefresh(access);
        return true;
      } else {
        // If profile fetch fails, force logout
        await logoutUser({ redirect: false });
        return false;
      }
    } catch (err) {
      // Don’t log the entire server traceback—only a short detail or message:
      console.error(
        '[AuthContext] loginUser error:',
        err.response?.data?.detail || err.message
      );
      return false;
    }
  };

  // ─── logoutUser: Clear storage, call backend logout to blacklist refresh, delete cookie ─
  const logoutUser = async ({ redirect = true } = {}) => {
    clearStoredAuth();
    setUser(null);

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    try {
      // POST /logout/ (your view blacklists the refresh cookie and deletes it)
      await api.post('logout/');
    } catch (err) {
      console.warn(
        '[AuthContext] Logout API failed:',
        err.response?.data?.detail || err.message
      );
    }

    if (redirect) {
      window.location.href = '/user/auth/';
    }
  };

  // ─── refreshAccessToken: POST /api/token/refresh/ relies on HttpOnly cookie ─────
  const refreshAccessToken = async () => {
    try {
      // Because api.withCredentials=true, the browser sends: Cookie: refresh_token=...
      const res = await api.post('token/refresh/');
      const { access } = res.data;
      if (!access) throw new Error('No access returned on refresh');

      localStorage.setItem('accessToken', access);

      // Fetch new profile (optional, but keeps “user” in sync)
      const profile = await fetchUserProfile(access);
      if (profile) {
        setUser(profile);
        scheduleSilentRefresh(access);
      } else {
        console.warn(
          '[AuthContext] Silent refresh: profile fetch failed'
        );
        localStorage.removeItem('accessToken');
        setUser(null);
      }
      return access;
    } catch (err) {
      console.error(
        '[AuthContext] Token refresh failed:',
        err.response?.data?.detail || err.message
      );
      clearStoredAuth();
      setUser(null);
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      return null;
    }
  };

  // ─── clearStoredAuth: remove localStorage keys ─────────────────────────────────
  const clearStoredAuth = () => {
    ['accessToken', 'hasLoggedIn', 'user'].forEach((key) =>
      localStorage.removeItem(key)
    );
  };

  // ─── scheduleSilentRefresh: decode access, schedule a refresh 1 minute before expiry ─
  const scheduleSilentRefresh = (accessToken) => {
    if (!accessToken) return;

    let decoded;
    try {
      // ↓ Call the default export directly
      decoded = jwtDecode(accessToken);
    } catch (e) {
      console.error('[AuthContext] Failed to decode access token.', e);
      clearStoredAuth();
      setUser(null);
      return;
    }

    const expiresAt = decoded.exp * 1000; // exp is in seconds; convert to ms
    const delay = expiresAt - Date.now() - BUFFER_TIME_MS;

    if (delay <= 0 || isNaN(delay)) {
      // If expired or invalid, refresh immediately
      refreshAccessToken();
      return;
    }

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }
    refreshTimeoutId = setTimeout(() => {
      refreshAccessToken();
    }, delay);
  };

  // ─── updateAccessToken: exposed for manual refresh triggers ───────────────────
  const updateAccessToken = async () => {
    await refreshAccessToken();
  };

  // ─── on mount: try to load from localStorage or silently refresh ───────────────
  useEffect(() => {
    setUpdateAccessTokenCallback(updateAccessToken);

    const tryLoad = async () => {
      const access = localStorage.getItem('accessToken');
      const hasLoggedIn = localStorage.getItem('hasLoggedIn') === 'true';

      if (access) {
        // 1) If we have an access token, check if it’s still valid by fetching profile
        const profile = await fetchUserProfile(access);
        if (profile) {
          setUser(profile);
          scheduleSilentRefresh(access);
        } else if (hasLoggedIn) {
          // 2) Access is invalid/expired but user did log in: try refresh
          await refreshAccessToken();
        }
      } else if (hasLoggedIn) {
        // We have no access token but did log in before: try refresh
        await refreshAccessToken();
      }

      setLoading(false);
    };

    tryLoad();

    return () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loginUser, logoutUser, updateAccessToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
