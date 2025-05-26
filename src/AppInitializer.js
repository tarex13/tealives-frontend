// AppInitializer.js
import { useEffect } from 'react';
import { setCities } from '../constants';
import api from './api'; // your axios wrapper or fetch helper

export default function AppInitializer() {
  useEffect(() => {
    api.get('/user/cities/')
      .then((res) => {
        setCities(res.data);
      })
      .catch((err) => {
        console.error('Failed to load cities:', err);
      });
  }, []);

  return null; // This component does not render anything
}
