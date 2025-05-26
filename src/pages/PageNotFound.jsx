import React from 'react';
import { Link } from 'react-router-dom';

function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center 
  dark:text-white px-4">
      <div className="bg-white/30 dark:bg-gray-800 backdrop-blur-md shadow-lg rounded-xl p-10 text-center max-w-md w-full">
        <h1 className="text-7xl font-extrabold mb-4 animate-pulse">404</h1>
        <p className="text-2xl font-semibold mb-6">Page Not Found</p>
        <p className="text-md text-gray-700 dark:text-gray-300 mb-6">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;
