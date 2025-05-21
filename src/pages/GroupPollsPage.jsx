import React, { useEffect, useState } from 'react';
import { createPoll, votePoll, fetchPosts } from '../requests';
import { useParams } from 'react-router-dom';

const GroupPollsPage = () => {
  const { id: groupId } = useParams();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleVote = async (pollId, optionId) => {
    try {
      await votePoll(pollId, optionId);
      alert('Vote recorded!');
    } catch (err) {
      console.error('Voting failed:', err);
    }
  };

  useEffect(() => {
    const loadPolls = async () => {
      try {
        const data = await fetchPosts('', '', null); 
        const groupPolls = data.results.filter(p => p.post_type === 'poll');
        setPolls(groupPolls);
      } catch (err) {
        console.error('Error loading polls:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPolls();
  }, [groupId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Group Polls</h2>
      {loading ? (
        <p>Loading polls...</p>
      ) : polls.length === 0 ? (
        <p>No polls found for this group.</p>
      ) : (
        <ul className="space-y-4">
          {polls.map((poll) => (
            <li key={poll.id} className="border p-4 rounded bg-white shadow">
              <h3 className="text-lg font-semibold">{poll.title}</h3>
              {poll.poll_details?.options?.map((opt) => (
                <button
                  key={opt.id}
                  className="block w-full text-left px-4 py-2 my-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => handleVote(poll.id, opt.id)}
                >
                  {opt.text} — {opt.votes_count} Votes
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupPollsPage;
