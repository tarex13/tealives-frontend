{/*Currently not being used */}
// src/pages/ListingConversations.jsx
import React, { useEffect, useState } from 'react';
import { fetchListingConversations } from '../requests';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function ListingConversations() {
  const { user } = useAuth();
  const { id: itemId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadConversations();
  }, [user, itemId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await fetchListingConversations(itemId);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Conversations for Listing #{itemId}</h2>

      {conversations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No conversations yet.</p>
      ) : (
        <ul className="space-y-4">
          {conversations.map((conv) => (
            <li key={conv.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{conv.buyer.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Started {new Date(conv.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/inbox?conversation=${conv.id}`)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                View Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
