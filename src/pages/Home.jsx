import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchPosts, fetchEvents, fetchPostById } from '../requests';
import FeedCard from '../components/FeedCard';
import CreatePost from '../components/CreatePost';
import EventCard from '../components/EventCard';
import CitySelectorModal from '../components/CitySelectorModal';
import { useAuth } from '../context/AuthContext';
import { CITIES } from '../../constants';
import { useCity } from '../context/CityContext';

function CityFilter() {
  const { city, setCity } = useCity();
  return (
    <div className="mb-4 flex flex-wrap items-center space-x-2">
      <label className="font-medium text-sm">City:</label>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="p-2 text-sm border rounded bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-300"
      >
        {CITIES.map((cityName) => (
          <option key={cityName} value={cityName}>
            {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

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
  );
}

function mixContent(posts, events) {
  const mixed = [];
  const eventFrequency = Math.floor(posts.length / (events.length + 1)) || posts.length + 1;
  let eventIndex = 0;

  posts.forEach((post, idx) => {
    mixed.push({ type: 'post', data: post });
    if ((idx + 1) % eventFrequency === 0 && eventIndex < events.length) {
      mixed.push({ type: 'event', data: events[eventIndex++] });
    }
  });

  while (eventIndex < events.length) {
    mixed.push({ type: 'event', data: events[eventIndex++] });
  }

  return mixed;
}

// same imports ...

function Home() {
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState('newest');
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { user } = useAuth();
  const { city } = useCity();
  const observer = useRef();

  const loadPosts = async (url = null) => {
    try {
      setLoadingMore(true);
      const res = await fetchPosts(city, sort, url);
      const newPosts = Array.isArray(res?.results) ? res.results : [];
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        const unique = newPosts.filter(p => !ids.has(p.id));
        return [...prev, ...unique];
      });
      setNext(res?.next || null);
    } catch {
      setError('Failed to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const postRes = await fetchPosts(city, sort);
      const eventRes = await fetchEvents(city);
      setPosts(postRes?.results || []);
      setEvents(eventRes?.results || []);
      setNext(postRes?.next || null);
    } catch {
      setError('Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!city) return;
    refreshContent();
  }, [city, sort]);

  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && next) loadPosts(next);
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, next]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!city) return <CitySelectorModal />;

  return (
    <main className="max-w-3xl mx-auto p-4 animate-fade-in-up text-gray-800 dark:text-white">
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
        <CityFilter />
        <SortFilter sort={sort} setSort={setSort} />
      </div>

      {user && (
        <CreatePost
          onPostCreated={async (newPost) => {
            const fullPost = await fetchPostById(newPost.id);
            setPosts(prev => [fullPost || newPost, ...prev]);
          }}
        />
      )}

      <h1 className="text-2xl font-bold text-center mb-6 text-blue-700 dark:text-blue-300">
        📍 {city.charAt(0).toUpperCase() + city.slice(1)} Community Feed
      </h1>

      {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading content...</p>}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}
      {!loading && posts.length === 0 && events.length === 0 && !error && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No content yet. Be the first to post in your city!
        </p>
      )}

      {mixContent(posts, events).map(item => (
        <div key={`${item.type}-${item.data.id}`} className="mb-6">
          {item.type === 'post' ? (
            <FeedCard post={item.data} />
          ) : (
            <div className="border rounded-lg p-4 shadow bg-yellow-50 dark:bg-yellow-900">
              <EventCard event={item.data} />
            </div>
          )}
        </div>
      ))}

      <div ref={lastElementRef} className="h-10" />

      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-20">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              refreshContent();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition focus:outline-none"
          >
            ⟳ Refresh
          </button>
        </div>
      )}
    </main>
  );
}

export default Home;
