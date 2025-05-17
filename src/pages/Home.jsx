import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchPosts, fetchEvents, fetchPostById } from '../requests';
import FeedCard from '../components/FeedCard';
import CreatePost from '../components/CreatePost';
import EventCard from '../components/EventCard';
import CitySelectorModal from '../components/CitySelectorModal';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';

function CityFilter() {
  const { city, setCity } = useCity();

  return (
    <div className="mb-4 flex items-center space-x-2">
      <label className="font-medium">Viewing posts in:</label>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="p-2 border rounded bg-white focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="toronto">Toronto</option>
        <option value="vancouver">Vancouver</option>
        <option value="calgary">Calgary</option>
        <option value="montreal">Montreal</option>
      </select>
    </div>
  );
}

function SortFilter({ sort, setSort }) {
  return (
    <div className="mb-4 flex items-center space-x-2">
      <label className="font-medium">Sort by:</label>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="p-2 border rounded bg-white focus:outline-none focus:ring focus:ring-blue-300"
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

// 🆕 Mixing Posts and Events
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

// 🆕 Countdown Timer Component
function CountdownTimer({ startTime, showCountdown }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = new Date(startTime) - new Date();
    return diff > 0 ? diff : 0;
  }

  useEffect(() => {
    if (!showCountdown) return;
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [startTime, showCountdown]);

  if (!showCountdown) return null;

  if (timeLeft <= 0) return <p className="text-green-600 font-semibold">🎉 Event Started!</p>;

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  const isUrgent = timeLeft < 3600000; // Less than 1 hour

  return (
    <p className={`font-semibold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
      ⏰ {days}d : {hours}h : {minutes}m : {seconds}s
    </p>
  );
}

function Home() {
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  const { user } = useAuth();
  const { city } = useCity();

  const loadPosts = async (url = null) => {
    try {
      setLoadingMore(true);
      const res = await fetchPosts(city, sort, url);
      const newPosts = Array.isArray(res?.results) ? res.results : [];

      // 🆕 Deduplicate Posts
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        const uniqueNew = newPosts.filter(p => !ids.has(p.id));
        return [...prev, ...uniqueNew];
      });

      setNext(res?.next || null);
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const postData = await fetchPosts(city, sort);
      const eventData = await fetchEvents(city);

      const newPosts = Array.isArray(postData?.results) ? postData.results : (Array.isArray(postData) ? postData : []);
      const newEvents = Array.isArray(eventData?.results) ? eventData.results : (Array.isArray(eventData) ? eventData : []);

      setPosts(newPosts);
      setEvents(newEvents);
      setNext(postData?.next || null);
    } catch (err) {
      console.error('Error refreshing content:', err);
      setError('Failed to load content. Please try again later.');
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
      if (entries[0].isIntersecting && next) {
        loadPosts(next);
      }
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
    <div className="max-w-2xl mx-auto p-4">
      <CityFilter />
      <SortFilter sort={sort} setSort={setSort} />

      {user && (
        <CreatePost
          onPostCreated={async (newPost) => {
            const fullPost = await fetchPostById(newPost.id);
            setPosts(prev => [fullPost || newPost, ...prev]);
          }}
        />
      )}

      <h1 className="text-2xl font-bold mb-4 text-center">
        Community Feed ({city.charAt(0).toUpperCase() + city.slice(1)})
      </h1>

      {loading && <p className="text-gray-500 text-center">Loading content...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
          {error}
        </div>
      )}

      {!loading && posts.length === 0 && events.length === 0 && !error && (
        <p className="text-gray-600 text-center">
          No posts or events found for {city}. Be the first to contribute!
        </p>
      )}

      {mixContent(posts, events).map((item) => (
        <div
          key={`${item.type}-${item.data.id}`}
          className="animate-fadeIn transition-opacity duration-500 mb-4"
        >
          {item.type === 'post' ? (
            <FeedCard post={item.data} />
          ) : (
            <>
              <EventCard event={item.data} />
              <CountdownTimer 
                startTime={item.data.start_time} 
                showCountdown={item.data.show_countdown} 
              />
            </>
          )}
        </div>
      ))}

      <div ref={lastElementRef} className="h-10" />

      {/* Back to Top with Refresh */}
      <div 
        className={`fixed bottom-4 right-4 transition-opacity duration-500 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          aria-label="Back to top and refresh"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            refreshContent();
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default Home;
