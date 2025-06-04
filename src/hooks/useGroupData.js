// src/hooks/useGroupData.js
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';                     // your axios instance
import { getGroupPosts, getGroupDetail, getGroupMembers } from '../requests';

/**
 * 1️⃣ Group Detail
 */
export function useGroupDetail(groupId) {
  const [group, setGroup]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError(null);

    getGroupDetail(groupId)
      .then(data => {
        if (!canceled) setGroup(data);
      })
      .catch(err => {
        if (!canceled) setError(err);
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [groupId]);

  return { group, setGroup, loading, error };
}

/**
 * 2️⃣ Group Members
 */
export function useGroupMembers(groupId) {
  const [members, setMembers]               = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers]     = useState(null);

  useEffect(() => {
    let canceled = false;
    setLoadingMembers(true);
    setErrorMembers(null);

    getGroupMembers(groupId)
      .then(res => {
        if (canceled) return;
        // getGroupMembers() returns an Axios response, so `.data` holds the actual payload
        const raw = res.data;
        const list =
          Array.isArray(raw?.results) ? raw.results :
          Array.isArray(raw) ? raw :
          [];
        setMembers(list);
      })
      .catch(err => {
        if (!canceled) setErrorMembers(err);
      })
      .finally(() => {
        if (!canceled) setLoadingMembers(false);
      });

    return () => {
      canceled = true;
    };
  }, [groupId]);

  return { members, setMembers, loadingMembers, errorMembers };
}

/**
 * 3️⃣ Paginated Group Posts
 */
export function usePaginatedGroupPosts(groupId) {
  const [posts, setPosts]               = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMore, setHasMore]           = useState(false);
  const [nextUrl, setNextUrl]           = useState(null);
  const observer = useRef(null);

  /**
   * Load either:
   *  • first page via getGroupPosts(groupId) → returns raw data { count, next, previous, results }
   *  • subsequent pages via api.get(nextUrl) → returns Axios response with `.data` = raw data
   */
  const load = useCallback(
    async (url = null) => {
      setLoadingPosts(true);
      try {
        let res;

        if (url) {
          // subsequent pages come back as an Axios response
          res = await api.get(url);
        } else {
          // first page: getGroupPosts returns raw JSON directly
          res = await getGroupPosts(groupId);
        }

        // Normalize into `raw` so that both paths have .results and .next
        const raw = res.data !== undefined ? res.data : res;
        const results = Array.isArray(raw.results) ? raw.results : [];
        const next = raw.next ?? null;

        // Append only new posts (avoid duplicates by ID)
        setPosts(prev => {
          const seen = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...results.filter((p) => !seen.has(p.id)),
          ];
        });

        setNextUrl(next);
        setHasMore(Boolean(next));
      } catch (err) {
        console.error('Error loading group posts', err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [groupId]
  );

  // On mount or whenever groupId changes, reset state and load the first page
  useEffect(() => {
    setPosts([]);
    setNextUrl(null);
    setHasMore(false);
    load(null);
  }, [groupId, load]);

  // IntersectionObserver: attach to “last post” DOM node
  const sentinelRef = useCallback(
    (node) => {
      if (loadingPosts) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          load(nextUrl);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingPosts, hasMore, nextUrl, load]
  );

  return { posts, loadingPosts, setPosts, hasMore, sentinelRef };
}
