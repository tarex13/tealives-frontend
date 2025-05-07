import { useEffect, useState } from 'react'

export default function useDarkMode() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    const classList = document.documentElement.classList
    if (enabled) {
      classList.add('dark')
    } else {
      classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(enabled))
  }, [enabled])

  return [enabled, setEnabled]
}
