// src/requests/group.js
import api from '../api'

export const getGroupDetail = (groupId) =>
  api.get(`groups/${groupId}/`)

export const getGroupMembers = (groupId) =>
  api.get(`groups/${groupId}/members/`)

export const joinGroup = (groupId) =>
  api.post(`groups/${groupId}/join/`)

export const leaveGroup = (groupId) =>
  api.post(`groups/${groupId}/leave/`)

export const promoteModerator = (groupId, userId) =>
  api.post(`groups/${groupId}/moderators/${userId}/promote/`)

export const demoteModerator = (groupId, userId) =>
  api.post(`groups/${groupId}/moderators/${userId}/demote/`)
