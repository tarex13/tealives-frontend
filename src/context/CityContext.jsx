import { createContext, useState, useEffect, useContext } from 'react'

const CityContext = createContext()

export function CityProvider({ children }) {
  const [city, setCity] = useState(() => {
    return localStorage.getItem('city') || ''
  })

  useEffect(() => {
    localStorage.setItem('city', city)
  }, [city])

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  )
}

export function useCity() {
  return useContext(CityContext)
}
