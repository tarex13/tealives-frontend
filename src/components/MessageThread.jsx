import { useEffect, useState } from 'react'
import { fetchThread, sendMessage } from '../api/messages'

function MessageThread({ userId, recipientName }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadThread = async () => {
    const data = await fetchThread(userId)
    setMessages(data)
    setLoading(false)
  }

  useEffect(() => {
    loadThread()
  }, [userId])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const msg = await sendMessage(userId, newMessage)
    setMessages((prev) => [...prev, msg])
    setNewMessage('')
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="font-bold text-lg mb-2">Chat with {recipientName}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="h-64 overflow-y-auto border p-2 mb-3">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm mb-1 ${m.is_own ? 'text-right' : 'text-left'}`}>
              <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                {m.content}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={handleSend}
          classNa="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default MessageThread
