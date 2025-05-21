import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../requests';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import '../css/Auth.css';
import { useNotification } from '../context/NotificationContext';

export default function Auth({isOpen, setSidebarOpen}) {
  const [formType, setFormType] = useState('login'); // login | register | forgot
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  if(user != null) {setSidebarOpen(true); showNotification('User already logged in!!!'); navigate('/');}

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (formType === 'login') {
        const data = await login({ username, password });
        loginUser({ access: data.access, refresh: data.refresh, user: data.user });
        setSidebarOpen(true);
        navigate('/');
      } else if (formType === 'register') {
        await register({ username, password, email });
        setFormType('login');
      } else if (formType === 'forgot') {
        alert('Password reset link sent to your email.');
        setFormType('login');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br dark:from-gray-800 from-gray-100 to-white relative overflow-hidden px-4">
      <div className="blob blob1" />
      <div className="blob blob2" />

      <div className="branding mb-10 md:mb-0 md:mr-20 text-center md:text-left z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Tealives</h1>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-md">
          Life’s Happening in Your City. <br />
          Join Conversations, Events & Marketplaces.
        </p>
      </div>

      <div className="form-card bg-white shadow-xl text-black rounded-lg p-6 w-full max-w-sm z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-center text-lg font-medium  capitalize">
            {formType === 'login' ? 'Login' : formType === 'register' ? 'Register' : 'Reset Password'}
          </h2>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {formType !== 'forgot' && (
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          {formType === 'register' && (
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          <input
            type={formType === 'forgot' ? 'email' : 'password'}
            placeholder={formType === 'forgot' ? 'Email' : 'Password'}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded transition"
          >
            {formType === 'login'
              ? 'Log In'
              : formType === 'register'
              ? 'Sign Up'
              : 'Send Reset Link'}
          </button>

          <div className="text-xs text-center text-gray-500 space-x-2">
            {formType !== 'login' && (
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => setFormType('login')}
              >
                Back to Login
              </span>
            )}
            {formType !== 'register' && (
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => setFormType('register')}
              >
                Sign Up
              </span>
            )}
            {formType !== 'forgot' && (
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => setFormType('forgot')}
              >
                Forgot?
              </span>
            )}
          </div>

          <div className="flex justify-center items-center gap-4 mt-2">
            <FaGoogle size={20} className="text-gray-700 cursor-pointer hover:text-orange-500" />
            <FaFacebook size={20} className="text-gray-700 cursor-pointer hover:text-blue-600" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm w-full mt-4 text-gray-600 underline hover:text-gray-800 transition"
          >
            Explore as Guest
          </button>
        </form>
      </div>
    </div>
  );
}
