// src/hooks/useCities.js
import { useState, useEffect } from 'react'
import api from '../api'                // your axios/fetch wrapper

const CITY_LIST_KEY = 'city_list'
const CITY_LIST_EXPIRES_KEY = 'city_list_expires'
const TTL = 7 * 24 * 60 * 60 * 1000    // 7 days in ms

// load any still-valid list from localStorage, sorted alphabetically
function loadStoredCities() {
  try {
    const raw = localStorage.getItem(CITY_LIST_KEY)
    const exp = parseInt(localStorage.getItem(CITY_LIST_EXPIRES_KEY), 10)
    if (!raw || isNaN(exp) || Date.now() > exp) {
      localStorage.removeItem(CITY_LIST_KEY)
      localStorage.removeItem(CITY_LIST_EXPIRES_KEY)
      return []
    }
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    // sort case-insensitive
    return arr.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  } catch {
    return []
  }
}

/**
 * useCities
 * - sync-seeds from localStorage (already sorted)
 * - fetches the definitive list from your backend, sorts it, caches it
 * - then runs IP lookup *only* to push the user’s city to the front
 *   if—and only if—it exists in that fetched list
 */
export function useCities() {
  const [cities, setCities] = useState(loadStoredCities)

  useEffect(() => {
    let fetchedList = null

    // 1) Fetch the canonical city list
    api.get('cities/')
      .then((res) => {
        const list = res.data
        if (Array.isArray(list) && list.length > 0) {
          // normalize to lowercase
          fetchedList = list.map((c) => c.toLowerCase())
          // sort alphabetically
          fetchedList.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
          )
          // update state → re-render dropdown
          setCities(fetchedList)
          // cache for next hard reload
          try {
            localStorage.setItem(CITY_LIST_KEY, JSON.stringify(fetchedList))
            localStorage.setItem(
              CITY_LIST_EXPIRES_KEY,
              (Date.now() + TTL).toString()
            )
          } catch {
            /* ignore storage errors */
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load cities:', err)
      })

    // 2) Once we have our list, optionally promote IP-detected city
    fetch('https://ipwho.is/')
      .then((res) => res.json())
      .then((data) => {
        const detected = data.city?.toLowerCase()
        // only promote if it was in your fetchedList
        if (detected && fetchedList?.includes(detected)) {
          setCities((prev) => {
            // remove any existing occurrence
            const without = prev.filter((c) => c !== detected)
            // put detected city at front, leave rest already sorted
            return [detected, ...without]
          })
        }
      })
      .catch(() => {
        /* silent fallback */
      })
  }, [])

  return cities
}
