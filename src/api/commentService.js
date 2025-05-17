import apiClient from './apiClient';

export const getComments = (postId, page = 1) => 
    apiClient.get(`posts/${postId}/comments/?page=${page}`);

export const addComment = (postId, data) => 
    apiClient.post(`posts/${postId}/comments/`, data);

export const editComment = (commentId, data) => 
    apiClient.put(`comments/${commentId}/`, data);

export const deleteComment = (commentId) => 
    apiClient.delete(`comments/${commentId}/`);
