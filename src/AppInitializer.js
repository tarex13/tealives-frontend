// src/AppInitializer.js
import React from 'react'
import { useCities } from './hooks/useCities'

/**
 * AppInitializer
 *
 * Simply calls the `useCities` hook on mount to:
 * 1) seed from localStorage synchronously
 * 2) trigger a backend fetch if needed
 * 3) fire an IP lookup for city‐promotion
 *
 * No manual `api.get('cities/')` or `setCities` calls required anymore.
 */
export default function AppInitializer() {
  useCities()  // kicks off all city‐loading side-effects

  return null  // this component doesn’t render any UI
}
