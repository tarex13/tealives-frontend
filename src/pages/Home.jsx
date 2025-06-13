// src/pages/Home.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react'
import { useLocation } from 'react-router-dom'
import { fetchPosts, fetchEvents, fetchPostById } from '../requests'
import FeedCard from '../components/FeedCard'
import CreatePost from '../components/CreatePost'
import EventCard from '../components/EventCard'
import CitySelectorModal from '../components/CitySelectorModal'
import { useAuth } from '../context/AuthContext'
import { useCity } from '../context/CityContext'

/**
 * CityFilter
 * — Fetches `city` + dynamic `cities` list from context
 * — Renders a <select> so user can switch city on the fly
 */
function CityFilter() {
  const { city, setCity, cities } = useCity()            // pull in our reactive city list
  return (
    <div className="mb-4 flex flex-wrap items-center space-x-2">
      <label className="font-medium text-sm">City:</label>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="p-2 text-sm border rounded bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-300"
      >
        {/* map over the context‐provided cities array */}
        {cities.map((cityName) => (
          <option key={cityName} value={cityName}>
            {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * SortFilter
 * — Unchanged: lets user pick post sort order
 */
function SortFilter({ sort, setSort }) {
  return (
    <div className="mb-4 flex items-center space-x-2">
      <label className="font-medium text-sm">Sort:</label>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="p-2 text-sm border rounded bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-300"
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

// Interleave posts + events (existing logic) ──────────────────────────────────
function mixContent(posts, events) {
  const mixed = []
  const eventFrequency =
    Math.floor(posts.length / (events.length + 1)) || posts.length + 1
  let eventIndex = 0

  posts.forEach((post, idx) => {
    mixed.push({ type: 'post', data: post })
    if ((idx + 1) % eventFrequency === 0 && eventIndex < events.length) {
      mixed.push({ type: 'event', data: events[eventIndex++] })
    }
  })
  while (eventIndex < events.length) {
    mixed.push({ type: 'event', data: events[eventIndex++] })
  }
  return mixed
}

export default function Home() {
  const { user } = useAuth()
  const { city } = useCity()             // current selected city
  const location = useLocation()

  // Optional “start” query param to feature a specific post
  const params = new URLSearchParams(location.search)
  const startId = params.get('start')

  // ───── Feed state ────────────────────────────────────────────────────────
  const [posts, setPosts]               = useState([])
  const [events, setEvents]             = useState([])
  const [next, setNext]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [sort, setSort]                 = useState('newest')
  const [error, setError]               = useState(null)

  // CreatePost modal + scroll-trigger state
  const [showModal, setShowModal]       = useState(false)
  const createCardRef                   = useRef(null)
  const [showBubble, setShowBubble]     = useState(false)

  // ───── Load initial feed & events ────────────────────────────────────────
  const refreshContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1) Fetch posts + events in parallel
      const [postRes, eventRes] = await Promise.all([
        fetchPosts(city, sort),
        fetchEvents(city),
      ])

      // 2) Store them
      setPosts(postRes.results || [])
      setEvents(eventRes.results || [])
      setNext(postRes.next || null)

      // 3) If “?start=ID” add that post to the front
      if (startId) {
        try {
          const featured = await fetchPostById(startId)
          if (featured?.id) {
            setPosts((prev) => {
              const deduped = prev.filter((p) => p.id !== featured.id)
              return [featured, ...deduped]
            })
          }
        } catch {
          console.warn(`Could not fetch postId=${startId}`)
        }
      }
    } catch {
      setError('Failed to load content.')
    } finally {
      setLoading(false)
    }
  }, [city, sort, startId])

  // Refresh on city, sort, or startId change
  useEffect(() => {
    if (city) refreshContent()
  }, [city, sort, startId, refreshContent])

  // ───── Infinite scroll “load more” ───────────────────────────────────────
  const observer = useRef()
  const lastRef  = useCallback(
    (node) => {
      if (loading || loadingMore) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && next) {
          setLoadingMore(true)
          fetchPosts(city, sort, next)
            .then((res) => {
              const newOnes = (res.results || []).filter(
                (p) => !posts.some((old) => old.id === p.id)
              )
              setPosts((prev) => [...prev, ...newOnes])
              setNext(res.next || null)
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false))
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, loadingMore, next, city, sort, posts]
  )

  // ───── Mobile “Create Post” bubble logic ──────────────────────────────────
  useEffect(() => {
    if (!createCardRef.current) return
    const io = new IntersectionObserver(
      ([e]) => setShowBubble(!e.isIntersecting),
      { threshold: 0 }
    )
    io.observe(createCardRef.current)
    return () => io.disconnect()
  }, [])

  // If no city is selected yet, show the CitySelector modal
  if (!city) return <CitySelectorModal />

  return (
    <>
      {/* Desktop CreatePost */}
      {user && (
        <div className="hidden md:block max-w-3xl mx-auto p-4 animate-fade-in-up text-gray-800 dark:text-white">
          <CreatePost
            onPostCreated={async (newPost) => {
              const full = await fetchPostById(newPost.id)
              setPosts((prev) => [full || newPost, ...prev])
            }}
          />
        </div>
      )}

      {/* Mobile CreatePost card */}
      {user && (
        <div
          ref={createCardRef}
          className="md:hidden mx-4 mb-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <h3 className="text-lg font-medium">Create Post</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap to share something new…
          </p>
        </div>
      )}

      {/* Floating bubble on mobile */}
      {user && showBubble && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none transition"
        >
          ＋
        </button>
      )}

      {/* CreatePost modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
            <CreatePost
              onPostCreated={async (newPost) => {
                const full = await fetchPostById(newPost.id)
                setPosts((prev) => [full || newPost, ...prev])
                setShowModal(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Main feed */}
      <main className="max-w-3xl mx-auto p-4 animate-fade-in-up text-gray-800 dark:text-white">
        <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
          <CityFilter />
          <SortFilter sort={sort} setSort={setSort} />
        </div>

        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading content…
          </p>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        {!loading && posts.length + events.length === 0 && !error && (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-20">
            No content yet. Be the first to post in your city!
          </p>
        )}

        {mixContent(posts, events).map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="mb-6">
            {item.type === 'post' ? (
              <FeedCard post={item.data} />
            ) : (
              <div className="rounded-lg shadow">
                <EventCard event={item.data} />
              </div>
            )}
          </div>
        ))}

        {/* infinite‐scroll sentinel */}
        <div ref={lastRef} className="h-10" />
        {loadingMore && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">
            Loading more…
          </p>
        )}
      </main>
    </>
  )
}
