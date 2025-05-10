import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  fetchThreads,
  fetchThread,
  fetchPublicProfile,
  sendMessage,
} from '../requests'
import { formatDistanceToNow, parseISO } from 'date-fns'

function Inbox() {
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // Filter: all, direct, group

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const autoOpenId = searchParams.get('to')

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const threadList = await fetchThreads()
        setThreads(threadList)

        if (autoOpenId) {
          let match = threadList.find(
            t => t.type === 'direct' && String(t.user.id) === autoOpenId
          )

          if (!match) {
            const user = await fetchPublicProfile(autoOpenId)
            match = { type: 'direct', user, messages: [] }
          }

          setActiveThread(match)
        }
      } catch (err) {
        console.error('Failed to load threads:', err)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [autoOpenId])

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeThread) return

      try {
        console.log(activeThread)
        if (activeThread.type === 'direct') {
          const threadMessages = await fetchThread(activeThread.user.id)
          setMessages(threadMessages)
        } else {
          // Navigate to Group Chat Page
          navigate(`/group-chat/${activeThread.group.id}`)
        }
      } catch {
        setMessages([])
      }
    }

    loadMessages()
  }, [activeThread, navigate])

  const handleSend = async () => {
    if (!content.trim() || !activeThread?.user?.id) return

    try {
      await sendMessage(activeThread.user.id, content)
      setMessages(prev => [
        ...prev,
        { content, is_own: true, sent_at: new Date().toISOString() },
      ])
      setContent('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const filteredThreads = threads.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  return (
    <div className="max-w-5xl mx-auto p-4 flex gap-6">
      {/* Sidebar - Threads */}
      <div className="w-1/3 border-r pr-4">
        <h2 className="text-lg font-bold mb-3">Conversations</h2>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'direct', 'group'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1 rounded ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredThreads.length === 0 && (
          <p className="text-sm text-gray-500">No conversations found.</p>
        )}

        {filteredThreads.map(t => (
          <div
            key={t.type === 'group' ? `group-${t.group.id}` : `user-${t.user.id}`}
            onClick={() => setActiveThread(t)}
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
              activeThread?.[t.type === 'group' ? 'group' : 'user']?.id ===
              (t.type === 'group' ? t.group.id : t.user.id)
                ? 'bg-gray-100'
                : ''
            }`}
          >
            <div>
              <strong>
                {t.type === 'group' ? `Group: ${t.group.name}` : t.user.username}
              </strong>
              <p className="text-xs text-gray-500 truncate w-40">
                {t.last_message}
              </p>
              <p className="text-xs text-gray-400">
                {t.message_count} message{t.message_count !== 1 ? 's' : ''} •{' '}
                {formatDistanceToNow(parseISO(t.last_message_time), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {t.unread_count > 0 && (
              <span className="ml-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {t.unread_count}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Right Pane - Messages */}
      <div className="flex-1 flex flex-col">
        {activeThread?.type === 'direct' ? (
          <>
            <div className="border-b pb-2 mb-3">
              <h3 className="text-lg font-semibold">
                Chat with {activeThread.user.username}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 border rounded p-3 bg-gray-50 h-80">
              {loading ? (
                <p className="text-sm text-gray-400">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-400">No messages yet. Say hi!</p>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 text-sm ${
                      m.is_own ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="inline-block bg-white rounded px-3 py-2 shadow-sm">
                      {m.content}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 border rounded p-2"
                placeholder="Type a message..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 mt-4">
            Select a conversation or start a new one.
          </p>
        )}
      </div>
    </div>
  )
}

export default Inbox
