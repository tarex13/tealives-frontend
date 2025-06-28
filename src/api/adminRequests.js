// src/api/adminRequests.js
import api from '../api'; // your configured Axios instance

// ----- Badge Definitions -----
export const fetchBadges = (params) =>
  api.get('/badges/', { params }).then(res => res.data);

export const createBadge = (formData) =>
  api.post('/badges/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateBadge = (id, data, isFormData = false) => {
  if (isFormData) {
    return api.put(`/badges/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put(`/badges/${id}/`, data);
};

export const deleteBadge = (id) =>
  api.delete(`/badges/${id}/`);

export const activateBadge = (id) =>
  api.post(`/badges/${id}/activate/`);

export const deactivateBadge = (id) =>
  api.post(`/badges/${id}/deactivate/`);

// ----- User List -----
export const fetchUsers = (params) =>
  api.get('/users/', { params }).then(res => res.data);

// ----- User Badges -----
export const fetchUserAssignments = (params) =>
  api.get('/badges/user/assignments/', { params }).then(res => res.data);

export const assignUserBadge = (userId, badgeId) =>
  api.post(`/badges/user/${userId}/assign/${badgeId}/`);

export const removeUserBadge = (userId, badgeId) =>
  api.post(`/badges/user/${userId}/remove/${badgeId}/`);

export const bulkAssignUserBadges = (assignments) =>
  api.post('/badges/user/bulk-assign/', { assignments });

export const bulkRemoveUserBadges = (assignments) =>
  api.post('/badges/user/bulk-remove/', { assignments });

// ----- Seller Badges -----
export const fetchSellerAssignments = (params) =>
  api.get('/badges/seller/assignments/', { params }).then(res => res.data);

export const assignSellerBadge = (userId, badgeId) =>
  api.post(`/badges/seller/${userId}/assign/${badgeId}/`);

export const removeSellerBadge = (userId, badgeId) =>
  api.post(`/badges/seller/${userId}/remove/${badgeId}/`);

export const bulkAssignSellerBadges = (assignments) =>
  api.post('/badges/seller/bulk-assign/', { assignments });

export const bulkRemoveSellerBadges = (assignments) =>
  api.post('/badges/seller/bulk-remove/', { assignments });

// ----- Mod Badges (admin only) -----
export const fetchModAssignments = (params) =>
  api.get('/badges/mod/assignments/', { params }).then(res => res.data);

export const assignModBadge = (userId, badgeId) =>
  api.post(`/badges/mod/${userId}/assign/${badgeId}/`);

export const removeModBadge = (userId, badgeId) =>
  api.post(`/badges/mod/${userId}/remove/${badgeId}/`);

export const bulkAssignModBadges = (assignments) =>
  api.post('/badges/mod/bulk-assign/', { assignments });

export const bulkRemoveModBadges = (assignments) =>
  api.post('/badges/mod/bulk-remove/', { assignments });

// ----- My Badges -----
export const fetchMyBadges = () =>
  api.get('/badges/my/').then(res => res.data);
