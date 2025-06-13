// src/context/CityContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import CitySelectorModal from '../components/CitySelectorModal'
import { useCities } from '../hooks/useCities'

// Keys & TTL (7 days in milliseconds)
const CITY_KEY = 'city'
const CITY_EXPIRES_KEY = 'city_expires'
const TTL = 7 * 24 * 60 * 60 * 1000

// Try to load a still-valid city from localStorage
function getValidStoredCity() {
  try {
    const stored = localStorage.getItem(CITY_KEY)
    const exp = parseInt(localStorage.getItem(CITY_EXPIRES_KEY), 10)

    // If missing/expired, wipe and return null
    if (!stored || isNaN(exp) || Date.now() > exp) {
      localStorage.removeItem(CITY_KEY)
      localStorage.removeItem(CITY_EXPIRES_KEY)
      return null
    }

    return stored
  } catch {
    return null
  }
}

const CityContext = createContext({
  city: /**@type{string|null}*/(null),
  setCity: /**@type{(c:string)=>void}*/(() => {}),
  cities: /**@type{string[]}*/([]),
})

export function CityProvider({ children }) {
  // 1) Seed our city state from localStorage if still valid
  const [city, setCityState] = useState(() => getValidStoredCity())

  // 2) Pull in the reactive city‐list via your hook
  const cities = useCities()

  // 3) Wrap setCity to apply TTL when writing
  const setCity = useCallback((newCity) => {
    // update React state
    setCityState(newCity)

    // cache with expiry
    try {
      const expires = Date.now() + TTL
      localStorage.setItem(CITY_KEY, newCity)
      localStorage.setItem(CITY_EXPIRES_KEY, expires.toString())
    } catch {
      // quota errors are non-fatal
    }
  }, [])

  // 4) (Optional) side-effects/logging whenever city changes
  useEffect(() => {
    if (city) {
      // e.g. analytics.pageView({ city })
    }
  }, [city])

  return (
    <CityContext.Provider value={{ city, setCity, cities }}>
      {/* Modal only if no valid city in state */}
      {!city && <CitySelectorModal />}
      {children}
    </CityContext.Provider>
  )
}

// custom hook for easy consumption
export const useCity = () => useContext(CityContext)
