import { useEffect, useState } from 'react'
import { fetchNotifications, markNotificationRead } from '../api/notifications'
import { useNavigate } from 'react-router-dom'

function NotificationDropdown() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNotifications()
        setNotifs(data.filter(n => !n.is_read))
      } catch (err) {
        console.error('Error loading notifications', err)
      }
    }
    load()
  }, [])

  const handleClick = async (notif) => {
    await markNotificationRead(notif.id)
    if (notif.link) navigate(notif.link)
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
          {notifs.length === 0 ? (
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
