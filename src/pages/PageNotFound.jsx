// src/pages/PageNotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PageNotFound() {
  return (
    <>
      <Helmet>
        <title>404 – Page Not Found | Tealives</title>
      </Helmet>

      {/* inline styles for blobs & keyframes */}
      <style>{`
        .auth-wrapper { position: relative; }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.25;
          animation: float 20s infinite ease-in-out;
        }
        .blob1 {
          width: 400px;
          height: 400px;
          background: #93c5fd;
          top: -100px;
          left: -100px;
        }
        .blob2 {
          width: 300px;
          height: 300px;
          background: #fcd34d;
          bottom: -80px;
          right: -80px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50%       { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>

      <div
        className="auth-wrapper
                   min-h-screen flex items-center justify-center px-4
                   bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900
                   overflow-hidden"
      >
        {/* animated background blobs */}
        <div className="blob blob1" />
        <div className="blob blob2" />

        <div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg
                     shadow-2xl rounded-2xl
                     p-8 sm:p-12
                     max-w-md w-full
                     text-center
                     z-10"
        >

          {/* 404 */}
          <h1 className="text-8xl font-extrabold text-orange-500 dark:text-orange-400 mb-4 animate-pulse">
            404
          </h1>

          {/* message */}
          <p className="text-2xl font-semibold mb-2">
            Oops… Page Not Found
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The page you’re looking for doesn’t exist or has been moved.
          </p>

          {/* back home */}
          <Link
            to="/"
            className="inline-block w-full
                       bg-orange-500 hover:bg-orange-600
                       dark:bg-orange-500 dark:hover:bg-orange-600
                       text-white font-medium
                       py-2 rounded-lg
                       transition"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </>
  );
}
