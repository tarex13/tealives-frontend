import React, { useEffect, useState } from 'react'
import { fetchNotifications, markNotificationRead } from '../requests'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NotificationDropdown() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.access) {
      console.warn('[DEBUG] Skipping fetch: no access token yet')
      return
    }

    const load = async () => {
      try {
        const data = await fetchNotifications()

        let allNotifs = []

        if (Array.isArray(data)) {
          allNotifs = data
        } else if (Array.isArray(data?.results)) {
          allNotifs = data.results
        }

        const unread = allNotifs.filter((n) => !n.is_read)
        setNotifs(unread)
      } catch (err) {
        console.error('Error loading notifications:', err)
        setError('Failed to load notifications.')
        setNotifs([])
      }
    }

    load()
  }, [user?.access])

  const handleClick = async (notif) => {
    try {
      await markNotificationRead(notif.id)
      setNotifs((prev) => prev.filter((n) => n.id !== notif.id))
      if (notif.link) {
        navigate(notif.link)
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError('Failed to mark notification as read.')
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        🔔
        {notifs.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1 rounded-full">
            {notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow rounded p-2 z-50">
          {error && (
            <p className="text-sm text-red-500 mb-2">
              {error}
            </p>
          )}

          {notifs.length === 0 && !error ? (
            <p className="text-sm text-gray-500">No new notifications</p>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className="text-sm py-2 px-2 hover:bg-gray-100 cursor-pointer rounded"
                onClick={() => handleClick(n)}
              >
                {n.content}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
