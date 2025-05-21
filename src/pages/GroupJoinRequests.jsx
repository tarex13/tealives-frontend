import React, { useEffect, useState } from 'react';
import { getJoinRequests, approveJoinRequest, declineJoinRequest } from '../requests';
import { useParams } from 'react-router-dom';

const GroupJoinRequests = () => {
  const { id: groupId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getJoinRequests(groupId);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load join requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      if (decision === 'approve') await approveJoinRequest(groupId, requestId);
      if (decision === 'decline') await declineJoinRequest(groupId, requestId);
      fetchRequests();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [groupId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Join Requests</h2>
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No pending join requests.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li key={req.id} className="flex justify-between items-center p-4 bg-white shadow rounded">
              <span>{req.user.username}</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleDecision(req.id, 'approve')}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(req.id, 'decline')}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupJoinRequests;
