// src/requests/group.js
import api from '../api'

export function getGroupPosts(groupId) {
  return api.get(`/groups/${groupId}/posts/`)
}

export const updateGroup = (groupId, data) => {
  // assuming `api` is Axios instance with baseURL pointing to '/api/'
  return api.patch(`groups/${groupId}/`, data);
};

export const getGroupDetail = (groupId) =>
  api.get(`groups/${groupId}/`)

export const getGroupMembers = (groupId) =>
  api.get(`groups/${groupId}/members/`)

export const joinGroup = (groupId) =>
  api.post(`groups/${groupId}/join/`)

export const leaveGroup = (groupId) =>
  api.post(`groups/${groupId}/leave/`)

export const promoteModerator = (groupId, userId) =>
  api.post(`groups/${groupId}/promote/${userId}/`)

export const demoteModerator = (groupId, userId) =>
  api.post(`groups/${groupId}/demote/${userId}/`)
