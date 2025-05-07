import { useState, useEffect } from 'react'
import { fetchThreads } from '../api/messages'
import MessageThread from '../components/MessageThread'
import { useSearchParams } from 'react-router-dom'

function Inbox() {
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [searchParams] = useSearchParams()
  const autoOpenId = searchParams.get('to')

  useEffect(() => {
    const load = async () => {
      const data = await fetchThreads()
      setThreads(data)
  
      if (autoOpenId) {
        const match = data.find((t) => String(t.user.id) === autoOpenId)
        if (match) setActiveThread(match)
      }
    }
    load()
  }, [autoOpenId])

  return (
    <div className="max-w-5xl mx-auto p-4 flex gap-6">
      <div className="w-1/3">
        <h2 className="text-lg font-bold mb-2">Conversations</h2>
        {threads.map((t) => (
          <div
            key={t.user.id}
            className="cursor-pointer p-2 border-b hover:bg-gray-50"
            onClick={() => setActiveThread(t)}
          >
            {t.user.username}
          </div>
        ))}
      </div>
      <div className="flex-1">
        {activeThread ? (
          <MessageThread
            userId={activeThread.user.id}
            recipientName={activeThread.user.username}
          />
        ) : (
          <p>Select a conversation</p>
        )}
      </div>
    </div>
  )
}

export default Inbox
