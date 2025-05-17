import apiClient from './apiClient';

export const getPolls = () => 
    apiClient.get('polls/');

export const getPoll = (pollId) => 
    apiClient.get(`polls/${pollId}/`);

export const createPoll = (data) => 
    apiClient.post('polls/', data);

export const votePoll = (pollId, selectedOption) => 
    apiClient.post('poll/vote/', { poll: pollId, selected_option: selectedOption });
