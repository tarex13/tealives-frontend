// src/contexts/AuthContext.js

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';    // ← keep this as-is
import api from '../api';
import { setUpdateAccessTokenCallback } from './AuthContextHelper';
import { useLocation } from 'react-router-dom'; // for redirect logic below

const AuthContext = createContext();
const BUFFER_TIME_MS = 60 * 1000; // 1 minute before expiry

export const AuthProvider = ({ children }) => {
  console.log('[AuthContext] AuthProvider mounted');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // We’ll use this to redirect to “/” after login
  const location = useLocation();

  // ─── Refs for “mounted” flag (for refreshAccessToken, etc.) ─────────────────
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef(null);

  // ─── On unmount: set isMountedRef=false, clear any pending timer, clear callback ─
  useEffect(() => {
    return () => {
      console.log('[AuthContext] AuthProvider unmounted → clearing isMountedRef, timer, callback');
      isMountedRef.current = false;

      if (refreshTimeoutRef.current) {
        console.log('[AuthContext] Clearing pending refreshTimeout on unmount');
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      setUpdateAccessTokenCallback(null);
    };
  }, []);

  // ─── Helper to remove exactly the keys we set in localStorage ─────────────────
  const clearStoredAuth = () => {
    console.log('[AuthContext] clearStoredAuth(): removing accessToken and hasLoggedIn');
    ['accessToken', 'hasLoggedIn'].forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  // ─── Fetch user profile via GET /user/profile/ with Bearer token ─────────────
  const fetchUserProfile = async (accessToken) => {
    console.log('[AuthContext] fetchUserProfile(): calling GET /user/profile/');
    try {
      const res = await api.get('user/profile/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('[AuthContext] fetchUserProfile(): success →', res.data);
      return res.data;
    } catch (err) {
      console.error(
        '[AuthContext] fetchUserProfile(): failed →',
        err.response?.data?.detail || err.message
      );
      return null;
    }
  };

  // ─── Logout: clear client state + POST /logout/ so refresh-token cookie is removed ─
  const logoutUser = async ({ redirect = true } = {}) => {
    console.log('[AuthContext] logoutUser() called');
    clearStoredAuth();
    if (isMountedRef.current) {
      console.log('[AuthContext] logoutUser(): clearing user state');
      setUser(null);
    }

    if (refreshTimeoutRef.current) {
      console.log('[AuthContext] logoutUser(): clearing pending refreshTimeout');
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    console.log('[AuthContext] logoutUser(): POST /logout/ → attempting to clear HttpOnly cookie');
    try {
      await api.post('logout/');
      console.log('[AuthContext] logoutUser(): POST /logout/ succeeded (cookie should be removed)');
    } catch (err) {
      console.warn(
        '[AuthContext] logoutUser(): POST /logout/ failed →',
        err.response?.data?.detail || err.message
      );
    }

    if (redirect) {
      console.log('[AuthContext] logoutUser(): redirecting to /user/auth/');
      window.location.href = '/user/auth/';
    }
  };

  // ─── Schedule one “silent refresh” 1 minute before the access-token expires ────
  const scheduleSilentRefresh = (accessToken) => {
    if (!accessToken) {
      console.log('[AuthContext] scheduleSilentRefresh(): no accessToken provided, skipping');
      return;
    }

    let decoded;
    try {
      console.log('[AuthContext] scheduleSilentRefresh(): attempting to decode accessToken');
      // Because you wrote `import { jwtDecode }`, the real decode may be the default:
      let decodeFn = null;
      if (typeof jwtDecode === 'function') {
        decodeFn = jwtDecode;
      } else if (jwtDecode && typeof jwtDecode.default === 'function') {
        decodeFn = jwtDecode.default;
      }
      if (!decodeFn) {
        throw new Error('jwtDecode is not a function');
      }
      decoded = decodeFn(accessToken);
      console.log('[AuthContext] scheduleSilentRefresh(): decoded token →', decoded);
    } catch (e) {
      console.error('[AuthContext] scheduleSilentRefresh(): Failed to decode →', e);
      clearStoredAuth();
      if (isMountedRef.current) {
        setUser(null);
      }
      return;
    }

    const expiresAt = decoded.exp * 1000; // exp is in seconds → convert to ms
    const delay = expiresAt - Date.now() - BUFFER_TIME_MS;
    console.log(
      `[AuthContext] scheduleSilentRefresh(): token expires at ${new Date(
        expiresAt
      ).toISOString()}, scheduling refresh in ${delay}ms`
    );

    // Clear any existing timer
    if (refreshTimeoutRef.current) {
      console.log('[AuthContext] scheduleSilentRefresh(): clearing existing timer');
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // If token is already expired or delay invalid, refresh immediately
    if (delay <= 0 || isNaN(delay)) {
      console.log('[AuthContext] scheduleSilentRefresh(): delay <= 0 or NaN → calling refreshAccessToken() immediately');
      refreshAccessToken();
      return;
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('[AuthContext] scheduleSilentRefresh: timeout fired → calling refreshAccessToken()');
      refreshTimeoutRef.current = null;

      const current = localStorage.getItem('accessToken');
      if (!current) {
        console.log('[AuthContext] scheduleSilentRefresh: no accessToken in localStorage when timeout fired, skipping');
        return;
      }

      await refreshAccessToken();
    }, delay);
  };

  // ─── Refresh the access token (backend reads HttpOnly cookie) ─────────────────
  const refreshAccessToken = async () => {
    console.log('[AuthContext] refreshAccessToken() called');
    try {
      const res = await api.post('token/refresh/');
      const { access } = res.data;
      console.log('[AuthContext] refreshAccessToken(): response →', res.data);

      if (!access) {
        throw new Error('No access returned on refresh');
      }

      console.log('[AuthContext] refreshAccessToken(): storing new access token');
      localStorage.setItem('accessToken', access);

      const profile = await fetchUserProfile(access);
      if (profile) {
        if (isMountedRef.current) {
          console.log('[AuthContext] refreshAccessToken(): profile fetch succeeded → setting user & scheduling next refresh');
          setUser(profile);
          scheduleSilentRefresh(access);
        } else {
          console.log('[AuthContext] refreshAccessToken(): profile OK but component unmounted, skipping setUser');
        }
      } else {
        console.warn('[AuthContext] refreshAccessToken(): profile fetch failed immediately → forcing logout');
        clearStoredAuth();
        if (isMountedRef.current) {
          setUser(null);
        }
      }

      return access;
    } catch (err) {
      const errCode = err.response?.data?.code;
      console.error('[AuthContext] refreshAccessToken(): error →', err.response?.data || err.message);

      if (errCode === 'token_not_valid') {
        console.error('[AuthContext] refreshAccessToken(): token_not_valid → calling logoutUser()');
        await logoutUser({ redirect: false });
        return null;
      }

      console.warn('[AuthContext] refreshAccessToken(): non-terminal error, clearing local state');
      clearStoredAuth();
      if (isMountedRef.current) {
        setUser(null);
      }
      if (refreshTimeoutRef.current) {
        console.log('[AuthContext] refreshAccessToken(): clearing pending timer after error');
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return null;
    }
  };

  // ─── Login: POST credentials → get {access, refresh} → fetch profile ───────────
  const loginUser = async ({ username, password }, redirectTo = '/') => {
    
    return;{/**Change Here */}
    try {
      const response = await api.post('token-login/', { username, password });
      const { access } = response.data;
      console.log('[AuthContext] loginUser(): response →', response.data);

      if (!access) {
        throw new Error('No access token returned');
      }

      // 1) Save access token and “hasLoggedIn” flag
      console.log('[AuthContext] loginUser(): storing accessToken & hasLoggedIn');
      localStorage.setItem('accessToken', access);
      localStorage.setItem('hasLoggedIn', 'true');

      // 2) Fetch profile
      const profile = await fetchUserProfile(access);
      if (profile) {
        if (isMountedRef.current) {
          console.log('[AuthContext] loginUser(): profile fetch succeeded → setting user & scheduling refresh');
          setUser(profile);
          scheduleSilentRefresh(access);

          // ─── Redirect to `redirectTo` after successful login ─────────
          if (location.pathname !== redirectTo) {
            console.log(`[AuthContext] loginUser(): redirecting to "${redirectTo}"`);
            window.location.href = redirectTo;
          }
        }
        return true;
      } else {
        console.warn('[AuthContext] loginUser(): profile fetch failed → calling logoutUser()');
        await logoutUser({ redirect: false });
        return false;
      }
    } catch (err) {
      console.error(
        '[AuthContext] loginUser(): error →',
        err.response?.data?.detail || err.message
      );
      return false;
    }
  };

  

  // ─── Exposed helper to manually force a refresh (for a “Refresh” button) ─────
  const updateAccessToken = async () => {
    console.log('[AuthContext] updateAccessToken() called');
    await refreshAccessToken();
  };

  // ─── On mount: set callback, then try to load tokens or do one silent refresh ───
  useEffect(() => {
    console.log('[AuthContext] Initial useEffect: setting updateAccessTokenCallback & starting tryLoad()');
    setUpdateAccessTokenCallback(updateAccessToken);

    let active = true; // ← “active” flag for this particular effect instance

    const tryLoad = async () => {
      console.log('[AuthContext] tryLoad() running');
      try {
        const access = localStorage.getItem('accessToken');
        const hasLoggedIn = localStorage.getItem('hasLoggedIn') === 'true';

        if (access) {
          console.log('[AuthContext] tryLoad(): found accessToken, calling fetchUserProfile');
          const profile = await fetchUserProfile(access);

          if (!active) {
            console.log('[AuthContext] tryLoad(): effect no longer active → aborting');
            return;
          }

          if (profile) {
            console.log('[AuthContext] tryLoad(): profile OK → setUser & scheduleSilentRefresh');
            setUser(profile);
            scheduleSilentRefresh(access);
          } else if (hasLoggedIn) {
            console.log('[AuthContext] tryLoad(): access invalid/expired but hasLoggedIn=true → refreshAccessToken');
            await refreshAccessToken();
          } else {
            console.log('[AuthContext] tryLoad(): access invalid/expired and hasLoggedIn=false → do nothing');
          }
        } else if (hasLoggedIn) {
          console.log('[AuthContext] tryLoad(): no accessToken but hasLoggedIn=true → refreshAccessToken');
          await refreshAccessToken();
        } else {
          console.log('[AuthContext] tryLoad(): no accessToken & hasLoggedIn=false → not logged in');
        }
      } catch (e) {
        console.error('[AuthContext] tryLoad(): unexpected error →', e);
      } finally {
        if (active) {
          console.log('[AuthContext] tryLoad() finished → setLoading(false)');
          setLoading(false);
        } else {
          console.log('[AuthContext] tryLoad() finished but effect no longer active, skipping setLoading');
        }
      }
    };

    tryLoad();

    return () => {
      console.log('[AuthContext] Cleanup of initial useEffect: setting active=false and clearing timer if needed');
      active = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      // The isMountedRef & callback cleanup happens in the other useEffect’s return
    };
  }, [location.pathname]);

  return (
    <AuthContext.Provider
      value={{ user, loginUser, logoutUser, updateAccessToken, setUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
