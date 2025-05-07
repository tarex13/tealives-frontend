import { createContext, useContext, useState, useEffect } from 'react'

const CityContext = createContext()

export const CityProvider = ({ children }) => {
  const [city, setCityState] = useState(() => {
    return localStorage.getItem('city') || null
  })

  const setCity = (newCity) => {
    setCityState(newCity)
    localStorage.setItem('city', newCity)
  }

  // Optional: fallback to default city if none is set after mount
  useEffect(() => {
    if (!city) {
      setCity('Toronto') // or show modal selector instead
    }
  }, [])

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  )
}

export const useCity = () => useContext(CityContext)
