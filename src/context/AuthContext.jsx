import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { setUpdateAccessTokenCallback } from './AuthContextHelper';

const AuthContext = createContext();
let refreshTimeoutId = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUserProfile = async (accessToken) => {
    try {
      const res = await api.get('user/profile/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err);
      return null;
    }
  };

  const loginUser = async ({ access, refresh }) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    const profile = await fetchUserProfile(access);
    if (profile) {
      setUser({ ...profile, access, refresh });
      scheduleSilentRefresh(access, refresh);
    } else {
      logoutUser();
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }
  };

  const updateAccessToken = (newAccess) => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      logoutUser();
      return;
    }
    fetchUserProfile(newAccess).then((profile) => {
      if (profile) {
        setUser({ ...profile, access: newAccess, refresh });
        localStorage.setItem('accessToken', newAccess);
        scheduleSilentRefresh(newAccess, refresh);
      } else {
        logoutUser();
      }
    });
  };

  const scheduleSilentRefresh = (accessToken, refreshToken) => {
    if (!accessToken || !refreshToken) {
      console.warn('[AuthContext] Missing tokens, cannot schedule refresh.');
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(accessToken);
    } catch (e) {
      console.error('[AuthContext] Failed to decode access token:', e);
      logoutUser();
      return;
    }

    const expiresAt = decoded.exp * 1000;
    const buffer = 60 * 1000; // Refresh 1 minute before expiry
    const delay = expiresAt - Date.now() - buffer;

    if (delay <= 0 || isNaN(delay)) {
      console.warn('[AuthContext] Token already expired or invalid delay.');
      return;
    }

    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    refreshTimeoutId = setTimeout(async () => {
      try {
        const res = await api.post('token/refresh/', { refresh: refreshToken });
        const { access, refresh: newRefresh } = res.data;
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', newRefresh);

        const profile = await fetchUserProfile(access);
        if (profile) {
          setUser({ ...profile, access, refresh: newRefresh });
          scheduleSilentRefresh(access, newRefresh);
          console.log('[AuthContext] Silent token refresh succeeded.');
        } else {
          logoutUser();
        }
      } catch (err) {
        console.error('[AuthContext] Silent refresh failed:', err);
        logoutUser();
      }
    }, delay);

    console.log(`[AuthContext] Token refresh scheduled in ${Math.round(delay / 1000)}s.`);
  };

  useEffect(() => {
    setUpdateAccessTokenCallback(updateAccessToken);

    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');

    if (access && refresh) {
      fetchUserProfile(access).then((profile) => {
        if (profile) {
          setUser({ ...profile, access, refresh });
          scheduleSilentRefresh(access, refresh);
        } else {
          logoutUser();
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, updateAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
