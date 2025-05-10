// src/context/AuthContextHelper.jsx

let updateAccessTokenCallback = null

export const setUpdateAccessTokenCallback = (callback) => {
  updateAccessTokenCallback = callback
}

export const getUpdateAccessTokenCallback = () => updateAccessTokenCallback
