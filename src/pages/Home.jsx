import { useEffect, useState } from 'react'
import { fetchPosts } from '../api/posts'
import FeedCard from '../components/FeedCard'
import { useAuth } from '../context/AuthContext'
import CreatePost from '../components/CreatePost'
import { fetchEvents } from '../api/events'
import EventCard from '../components/EventCard'

function Home() {
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPosts(user?.city || '')
        setPosts(data)
        const eventData = await fetchEvents(user?.city || '')
        setEvents(eventData)

      } catch (err) {
        console.error('Error loading posts:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return (
    <div className="max-w-2xl mx-auto p-4">
      {user && <CreatePost onPostCreated={(newPost) => setPosts([newPost, ...posts])} />}
      <h1 className="text-2xl font-bold mb-4">Community Feed</h1>
      {loading && <p>Loading posts...</p>}
      {posts.length === 0 && !loading && <p>No posts found in your city.</p>}
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
      <h2 className="text-xl font-bold mb-2 mt-10">Upcoming Events</h2>
      {events.length === 0 && <p className="text-sm text-gray-500">No events yet.</p>}
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
))}
    </div>
  )
}


export default Home
