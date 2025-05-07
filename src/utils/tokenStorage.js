export const getStoredUser = () => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  }
  
  export const setStoredUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user))
  }