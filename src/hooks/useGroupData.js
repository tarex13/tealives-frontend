// src/hooks/useGroupData.js
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api'                  // your axios instance
//import * as groupApi from '../requests/group'  // includes getGroupDetail, getGroupMembers, getGroupPosts
import {getGroupPosts, getGroupDetail, getGroupMembers} from '../requests'
// ———————————————
// 1️⃣ Group Detail
// ———————————————
export function useGroupDetail(groupId) {
  const [group, setGroup]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let canceled = false
    setLoading(true)
    setError(null)

    getGroupDetail(groupId)
      .then(data => {
        if (!canceled) setGroup(data)
      })
      .catch(err => {
        if (!canceled) setError(err)
      })
      .finally(() => {
        if (!canceled) setLoading(false)
      })

    return () => { canceled = true }
  }, [groupId])

  return { group, setGroup, loading, error }
}


// ———————————————
// 2️⃣ Group Members
// ———————————————
export function useGroupMembers(groupId) {
  const [members, setMembers]             = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [errorMembers, setErrorMembers]     = useState(null)

  useEffect(() => {
    let canceled = false
    setLoadingMembers(true)
    setErrorMembers(null)

    getGroupMembers(groupId)
      .then(res => {
        if (canceled) return
        const raw = res.data
        const list = Array.isArray(raw?.results)
          ? raw.results
          : Array.isArray(raw)
            ? raw
            : []
        setMembers(list)
      })
      .catch(err => {
        if (!canceled) setErrorMembers(err)
      })
      .finally(() => {
        if (!canceled) setLoadingMembers(false)
      })

    return () => { canceled = true }
  }, [groupId])

  return { members, setMembers, loadingMembers, errorMembers }
}


// ————————————————————————
// 3️⃣ Paginated Group Posts
// ————————————————————————
export function usePaginatedGroupPosts(groupId) {
  const [posts, setPosts]               = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [hasMore, setHasMore]           = useState(false)
  const [nextUrl, setNextUrl]           = useState(null)
  const observer = useRef()

  const load = useCallback(async (url = null) => {
    setLoadingPosts(true)
    try {
      let res

      if (url) {
        // subsequent pages: full URL from DRF
        res = await api.get(url)
      } else {
        // first page: call our group posts endpoint
        res = await getGroupPosts(groupId)
      }

      // your console.log(res) showed this shape:
      // {
      //   data: {
      //     count: 1,
      //     next: null,
      //     previous: null,
      //     results: [/* your post objects */]
      //   },
      //   status: 200,
      //   ...
      // }

    const data = res;  // because your .then(res => res.data) returns data directly
    const {
    results = [],
    next = null
    } = data;

      // append only new posts
      setPosts(prev => {
        const seen = new Set(prev.map(p => p.id))
        return [
          ...prev,
          ...results.filter(p => !seen.has(p.id))
        ]
      })

      setNextUrl(next)
      setHasMore(Boolean(next))
    } catch (err) {
      console.error('Error loading group posts', err)
    } finally {
      setLoadingPosts(false)
    }
  }, [groupId])

  // on mount or when groupId changes, reset and load first page
  useEffect(() => {
    setPosts([])
    load(null)
  }, [groupId, load])

  // intersection observer for infinite scroll
  const sentinelRef = useCallback(node => {
    if (loadingPosts) return
    observer.current?.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        load(nextUrl)
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingPosts, hasMore, nextUrl, load])

  return { posts, loadingPosts, setPosts, hasMore, sentinelRef }
}
