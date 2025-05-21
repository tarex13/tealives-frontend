import { useState, useEffect, useCallback, useRef } from 'react';
import throttle from 'lodash.throttle';
import api from '../api';

export function usePaginatedPosts(userId) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();
  const firstLoadRef = useRef(false);

  const fetchPosts = useCallback(
    throttle(async () => {
      if (!userId || loading || !hasMore) return;
      setLoading(true);
      try {
        const res = await api.get(`posts/?user=${userId}&page=${page}`);
        const newPosts = Array.isArray(res.data?.results) ? res.data.results : [];
        setPosts((prev) => [...prev, ...newPosts]);
        setHasMore(!!res.data.next);
        setPage((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoading(false);
      }
    }, 800),
    [userId, page, loading, hasMore]
  );

  // 🔥 Trigger the first fetch manually once userId is available
  useEffect(() => {
    if (userId && !firstLoadRef.current) {
      firstLoadRef.current = true;
      fetchPosts();
    }
  }, [userId, fetchPosts]);

  const sentinelRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [fetchPosts, loading, hasMore]
  );

  return { posts, hasMore, loading, sentinelRef };
}
