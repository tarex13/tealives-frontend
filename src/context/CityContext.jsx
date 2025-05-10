import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import CitySelector from '../components/CitySelector' // Make sure this path is correct

const CityContext = createContext()

export const CityProvider = ({ children }) => {
  const [city, setCityState] = useState(() => {
    return localStorage.getItem('city') || null
  })

  const setCity = (newCity) => {
    setCityState(newCity)
    localStorage.setItem('city', newCity)
  }

  useEffect(() => {
    // Optional logging or analytics can go here
  }, [city])

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {/* Show CitySelector only if no city is set */}
      {!city && <CitySelector />}
      {children}
    </CityContext.Provider>
  )
}

export const useCity = () => useContext(CityContext)
