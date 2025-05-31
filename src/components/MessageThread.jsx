// src/components/MessageThread.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Spinner from './Spinner'
import { fetchThread, sendMessage } from '../requests'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { FiSend } from 'react-icons/fi'
import classNames from 'classnames'

export default function MessageThread({
  userId,
  recipientName,
  currentUserId,
}) {
  const [messages, setMessages] = useState([])
  const [content, setContent]   = useState('')
  const [typing, setTyping]     = useState(false)
  const [loading, setLoading]   = useState(true)

  const wsRef            = useRef(null)
  const endRef           = useRef(null)
  const typingTimeoutRef = useRef(null)
  const token            = localStorage.getItem('accessToken')

  // scroll to bottom any time messages change
  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(scrollToBottom, [messages, scrollToBottom])

  // initial load of thread
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchThread(userId)
        if (!cancelled) setMessages(data)
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  // WebSocket setup
  useEffect(() => {
    if (!userId || !token) return
    const socket = new WebSocket(
      `ws://localhost:8000/ws/chat/${userId}/?token=${token}`
    )
    wsRef.current = socket

    socket.onopen = () => console.log('WS connected')
    socket.onclose = () => console.log('WS disconnected')

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.typing && data.sender_id === userId) {
        setTyping(true)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false)
        }, 1500)
        return
      }

      setMessages(ms => [
        ...ms,
        {
          content: data.message,
          is_own: data.sender_id === currentUserId,
          sent_at: new Date().toISOString(),
        },
      ])
    }

    return () => {
      clearTimeout(typingTimeoutRef.current)
      socket.close()
    }
  }, [userId, currentUserId, token])

  // send via WS + API
  const handleSend = useCallback(async () => {
    if (!content.trim()) return

    // optimistic append
    const newMsg = {
      content,
      is_own: true,
      sent_at: new Date().toISOString(),
    }
    setMessages(ms => [...ms, newMsg])
    setContent('')
    scrollToBottom()

    // send over WS
    const sock = wsRef.current
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ message: content }))
    }

    // persist via REST
    try {
      await sendMessage(userId, content)
    } catch (err) {
      console.error('Persist failed:', err)
      // you could mark this message as failed here
    }
  }, [content, userId, scrollToBottom])

  // notify peer that we are typing
  const handleTyping = useCallback(() => {
    const sock = wsRef.current
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ typing: true }))
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Chat with {recipientName}
        </h2>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        role="log"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex justify-center my-8">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((m, i) => {
            const bubbleClasses = classNames(
              'inline-block px-4 py-2 rounded-lg max-w-[75%] shadow',
              m.is_own
                ? 'bg-teal-500 text-white rounded-tr-2xl rounded-br-2xl'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-2xl rounded-bl-2xl'
            )
            const containerClasses = classNames(
              'flex flex-col',
              m.is_own ? 'items-end' : 'items-start'
            )
            return (
              <div key={i} className={containerClasses}>
                <div className={bubbleClasses}>{m.content}</div>
                <span className="mt-1 text-2xs text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(parseISO(m.sent_at), { addSuffix: true })}
                </span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Typing indicator */}
      {typing && (
        <div className="px-6 py-2 text-center text-xs italic text-gray-500 dark:text-gray-400">
          {recipientName} is typing…
        </div>
      )}

      {/* Composer */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-100 dark:bg-gray-700 flex items-center space-x-2">
        <input
          type="text"
          aria-label="Type your message"
          placeholder="Type your message…"
          value={content}
          onChange={e => {
            setContent(e.target.value)
            handleTyping()
          }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="
            flex-1
            px-4 py-2
            bg-white dark:bg-gray-800
            ring-1 ring-gray-300 dark:ring-gray-600
            rounded-full
            focus:outline-none focus:ring-2 focus:ring-teal-400
            transition
          "
        />
        <button
          onClick={handleSend}
          aria-label="Send message"
          className="
            p-2 rounded-full
            bg-teal-500 hover:bg-teal-600
            text-white
            shadow-md
            transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={!content.trim()}
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
