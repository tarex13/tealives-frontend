// src/main.jsx
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import { AuthProvider } from './context/AuthContext'
import { CityProvider } from './context/CityContext'
import { SpeedInsights } from "@vercel/speed-insights/react"


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CityProvider>  {/* Moved outside */}
        <AuthProvider>
          <App />
          <SpeedInsights />
        </AuthProvider>
      </CityProvider>
    </BrowserRouter>
  </React.StrictMode>
)
