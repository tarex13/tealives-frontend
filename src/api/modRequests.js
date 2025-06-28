// src/api/modRequests.js
import * as adminApi from './adminRequests';
import { useAuth } from '../context/AuthContext';

// For moderator usage: restrict to user/seller badge types and same-city users
export const fetchBadgesForMod = async (badgeType, params = {}) => {
  // badgeType: 'user' or 'seller'
  // filter out mod/business badges
  return adminApi.fetchBadges({ badge_type: badgeType, is_active: true, ...params });
};

export const fetchUsersForMod = async (city, params = {}) => {
  // fetch users in moderator's city
  return adminApi.fetchUsers({ city, ...params });
};

export const fetchAssignmentsForMod = async (badgeType, params = {}) => {
  if (badgeType === 'user') {
    return adminApi.fetchUserAssignments(params);
  }
  if (badgeType === 'seller') {
    return adminApi.fetchSellerAssignments(params);
  }
  throw new Error('Invalid badgeType for mod');
};

export const assignBadgeForMod = (badgeType, userId, badgeId) => {
  if (badgeType === 'user') {
    return adminApi.assignUserBadge(userId, badgeId);
  }
  if (badgeType === 'seller') {
    return adminApi.assignSellerBadge(userId, badgeId);
  }
  throw new Error('Invalid badgeType for mod');
};

export const removeBadgeForMod = (badgeType, userId, badgeId) => {
  if (badgeType === 'user') {
    return adminApi.removeUserBadge(userId, badgeId);
  }
  if (badgeType === 'seller') {
    return adminApi.removeSellerBadge(userId, badgeId);
  }
  throw new Error('Invalid badgeType for mod');
};

export const bulkAssignForMod = (badgeType, assignments) => {
  if (badgeType === 'user') {
    return adminApi.bulkAssignUserBadges(assignments);
  }
  if (badgeType === 'seller') {
    return adminApi.bulkAssignSellerBadges(assignments);
  }
  throw new Error('Invalid badgeType for mod');
};

export const bulkRemoveForMod = (badgeType, assignments) => {
  if (badgeType === 'user') {
    return adminApi.bulkRemoveUserBadges(assignments);
  }
  if (badgeType === 'seller') {
    return adminApi.bulkRemoveSellerBadges(assignments);
  }
  throw new Error('Invalid badgeType for mod');
};
