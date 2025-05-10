import React, { useEffect, useState, useRef } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fetchGroupMessages, sendGroupMessage, markGroupMessagesRead } from '../requests'

function GroupChatThread({ groupId, groupName, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const ws = useRef(null)
  const messagesEndRef = useRef(null)

  const token = localStorage.getItem('userToken')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetchGroupMessages(groupId)
        setMessages(res)
        // ✅ Mark messages as read when user opens chat
        await markGroupMessagesRead(groupId)
      } catch (err) {
        console.error('Failed to fetch group messages:', err)
      }
    }
    loadMessages()
  }, [groupId])

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/group/${groupId}/?token=${token}`)

    ws.current.onopen = () => console.log('WebSocket connected')
    ws.current.onclose = () => console.log('WebSocket disconnected')

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.typing) {
        setTypingUsers(prev => new Set(prev.add(data.sender_id)))
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.sender_id)
            return newSet
          })
        }, 3000)
        return
      }

      setMessages(prev => [
        ...prev,
        {
          content: data.message,
          is_own: data.sender_id === currentUserId,
          sender_id: data.sender_id,
          sent_at: new Date().toISOString(),
        },
      ])
      scrollToBottom()
    }

    return () => ws.current.close()
  }, [groupId, currentUserId, token])

  const handleSend = async () => {
    if (!content.trim()) return

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: content }))
    }

    try {
      await sendGroupMessage(groupId, content)
    } catch (err) {
      console.error('Failed to send group message via API:', err)
    }

    setMessages(prev => [
      ...prev,
      { content, is_own: true, sender_id: currentUserId, sent_at: new Date().toISOString() },
    ])
    setContent('')
    scrollToBottom()
  }

  const handleTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ typing: true }))
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Group: {groupName}</h3>

      <div className="border rounded h-64 overflow-y-auto p-2 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm mb-2 ${m.is_own ? 'text-right' : 'text-left'}`}
            >
              <span className="inline-block bg-white p-2 rounded shadow-sm">
                {m.content}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(parseISO(m.sent_at), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ✅ Typing Indicator */}
      {typingUsers.size > 0 && (
        <p className="text-xs text-gray-500 italic">
          {Array.from(typingUsers).length === 1
            ? 'Someone is typing...'
            : 'Multiple users are typing...'}
        </p>
      )}

      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
          value={content}
          onChange={e => {
            setContent(e.target.value)
            handleTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default GroupChatThread
