import React, { useEffect, useState, useRef } from 'react';
import { getGroupMessages, sendGroupMessage } from '@/utils/requests';
import { Input, Button } from '@/components/ui';
import { useParams } from 'react-router-dom';

export default function GroupChat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    const response = await getGroupMessages(id);
    setMessages(response.data);
    scrollToBottom();
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    await sendGroupMessage(id, { content });
    setContent('');
    fetchMessages();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="p-4 flex flex-col h-[80vh]">
      <div className="flex-1 overflow-auto mb-4 border p-2 rounded bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`my-2 ${msg.is_own ? 'text-right' : 'text-left'}`}>
            <p className="text-sm text-gray-600">{msg.sender.username}</p>
            <p className="p-2 bg-white inline-block rounded shadow">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..." />
        <Button onClick={handleSend} className="ml-2">Send</Button>
      </div>
    </div>
  );
}
