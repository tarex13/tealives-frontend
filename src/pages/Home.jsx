import React, { useEffect, useState } from 'react'
import { fetchPosts, fetchEvents } from '../requests'
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
        <option value="toronto">Toronto</option>
        <option value="vancouver">Vancouver</option>
        <option value="calgary">Calgary</option>
        <option value="montreal">Montreal</option>
      </select>
    </div>
  )
}

function SortFilter({ sort, setSort }) {
  return (
    <div className="mb-4">
      <label className="mr-2 font-medium">Sort by:</label>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="p-1 border rounded"
      >
        <option value="newest">🆕 Newest</option>
        <option value="hottest">🔥 Hottest</option>
        <option value="discussed">💬 Most Discussed</option>
        <option value="highlights">🎯 Highlights</option>
        <option value="random">🎲 Surprise Me</option>
      </select>
    </div>
  )
}

function Home() {
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [next, setNext] = useState(null)
  const [sort, setSort] = useState('newest')

  const { user } = useAuth()
  const { city } = useCity()

  const loadPosts = async (url = null) => {
    try {
      const res = await fetchPosts(city, sort, url)
      const newPosts = Array.isArray(res?.results) ? res.results : []
      setPosts((prev) => [...prev, ...newPosts])
      setNext(res?.next || null)
    } catch (err) {
      console.error('Error loading more posts:', err)
      setError('Failed to load more posts.')
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      setPosts([])
      setEvents([])
      try {
        const postData = await fetchPosts(city, sort)
        const eventData = await fetchEvents(city)

        const newPosts = Array.isArray(postData?.results)
          ? postData.results
          : Array.isArray(postData)
          ? postData
          : []

        const newEvents = Array.isArray(eventData?.results)
          ? eventData.results
          : Array.isArray(eventData)
          ? eventData
          : []

        setPosts(newPosts)
        setEvents(newEvents)
        setNext(postData?.next || null)
      } catch (err) {
        console.error('Error loading content:', err)
        setError('Failed to load content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (city) {
      load()
    }
  }, [city, sort])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CityFilter />
      <SortFilter sort={sort} setSort={setSort} />

      {user && (
        <CreatePost onPostCreated={(newPost) => setPosts([newPost, ...posts])} />
      )}

      <h1 className="text-2xl font-bold mb-4">
        Community Feed ({city.charAt(0).toUpperCase() + city.slice(1)})
      </h1>

      {loading && <p className="text-gray-500">Loading posts...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <p className="text-gray-600">No posts found for {city}. Be the first to post!</p>
      )}

      {Array.isArray(posts) &&
        posts.map((post) => <FeedCard key={post.id} post={post} />)}

      {next && !loading && (
        <button
          onClick={() => loadPosts(next)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Load more
        </button>
      )}

      <h2 className="text-xl font-bold mt-10 mb-2">Upcoming Events</h2>

      {loading && <p className="text-gray-500">Loading events...</p>}

      {!loading && events.length === 0 && !error && (
        <p className="text-sm text-gray-500">No events yet for {city}.</p>
      )}

      {Array.isArray(events) &&
        events.map((event) => <EventCard key={event.id} event={event} />)}
    </div>
  )
}

export default Home
