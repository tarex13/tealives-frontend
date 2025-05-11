import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import React from 'react'
import Spinner from './Spinner';

export default function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
