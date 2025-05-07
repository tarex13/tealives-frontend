import { useEffect, useState } from 'react'
import { fetchPosts } from '../api/posts'
import { fetchEvents } from '../api/events'
import FeedCard from '../components/FeedCard'
import CreatePost from '../components/CreatePost'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'
import { useCity } from '../context/CityContext'

function CityFilter() {
  const { city, setCity } = useCity()

  return (
    <div className="mb-4">
      <label className="mr-2 font-medium">Viewing posts in:</label>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="p-1 border rounded"
      >
        <option value="Toronto">Toronto</option>
        <option value="Vancouver">Vancouver</option>
        <option value="Calgary">Calgary</option>
        <option value="Montreal">Montreal</option>
      </select>
    </div>
  )
}

function Home() {
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { city } = useCity() // ✅ useCity context is now central

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const postData = await fetchPosts(city)
        const eventData = await fetchEvents(city)
        setPosts(postData)
        setEvents(eventData)
      } catch (err) {
        console.error('Error loading content:', err)
      } finally {
        setLoading(false)
      }
    }

    if (city) {
      load()
    }
  }, [city]) // 🔁 Re-fetch when city changes

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CityFilter />

      {user && (
        <CreatePost
          onPostCreated={(newPost) => setPosts([newPost, ...posts])}
        />
      )}

      <h1 className="text-2xl font-bold mb-4">Community Feed ({city})</h1>

      {loading && <p>Loading posts...</p>}
      {!loading && posts.length === 0 && (
        <p>No posts found for {city}. Be the first to post!</p>
      )}
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}

      <h2 className="text-xl font-bold mt-10 mb-2">Upcoming Events</h2>
      {events.length === 0 && (
        <p className="text-sm text-gray-500">No events yet for {city}.</p>
      )}
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

export default Home
