// src/pages/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login,           // This is your “login” request helper (POST /api/token/)
  register,
  fetchCities,
  fetchBusinessTypes,
} from '../requests';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import '../css/Auth.css';
import { useNotification } from '../context/NotificationContext';
import api from '../api';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function Auth({ isOpen, setSidebarOpen }) {
  const [formType, setFormType] = useState('login'); // login | register | forgot
  const [step, setStep] = useState(0);

  // common fields
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  // register-step-1 fields
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // business toggle + fields
  const [isBusiness, setIsBusiness] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // dropdown data
  const [cities, setCities] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);

  const { showNotification } = useNotification();
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  // 1️⃣ If already logged in, open sidebar + redirect home
  useEffect(() => {
    if (user) {
      setSidebarOpen(true);
      showNotification('User already logged in!');
      navigate('/');
    }
  }, [user]);

  // 2️⃣ Fetch “cities” & “business types” on mount
  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(console.error);

    fetchBusinessTypes()
      .then(setBusinessTypes)
      .catch(console.error);
  }, []);

  // 3️⃣ Username availability check
  const checkUsername = async () => {
    if (!username.trim()) return;
    try {
      const res = await api.get(`user/check-username/?username=${username}`);
      setUsernameAvailable(res.data.available);
    } catch {
      setUsernameAvailable(null);
    }
  };

  // 4️⃣ Handle “submit” for login / register / forgot
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (formType === 'login') {
        // Instead of passing “access” into loginUser, call loginUser({ username, password })
        const success = await loginUser({ username, password });
        if (success) {
          setSidebarOpen(true);
          navigate('/');
        } else {
          setError('Invalid credentials.');
          setPassword('');
        }
      } else if (formType === 'register') {
        if (step === 0) {
          if (!usernameAvailable) {
            setError('Please choose an available username.');
            return;
          }
          setStep(1);
          return;
        }

        // build registration payload
        const payload = {
          username,
          email,
          password,
          city,
          dob,
          phone_number: phoneNumber,
          is_business: isBusiness,
        };
        if (isBusiness) {
          payload.business_name = businessName;
          payload.business_type = businessType;
        }

        await register(payload);

        setFormType('login');
        setStep(0);
        showNotification('Account created! Log in to continue.');
        navigate('/profile/edit');
      } else if (formType === 'forgot') {
        // trigger password reset flow
        alert('Password reset link sent to your email.');
        setFormType('login');
      }
    } catch {
      setError('Authentication failed. Please try again.');
      setPassword('');
    }
  };

  // Progress bar for registration steps
  const renderStepProgress = () => {
    if (formType !== 'register') return null;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            step === 0 ? 'bg-orange-400 w-1/2' : 'bg-orange-500 w-full'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="auth-wrapper min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br dark:from-gray-800 from-gray-100 to-white relative overflow-hidden px-4">
      <div className="blob blob1" />
      <div className="blob blob2" />

      <div className="branding mb-10 md:mb-0 md:mr-20 text-center md:text-left z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Tealives</h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
          Life’s Happening in Your City. <br />
          Join Conversations, Events & Marketplaces.
        </p>
      </div>

      <div className="form-card bg-white shadow-xl text-black rounded-lg p-6 w-full max-w-sm z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-center text-lg font-medium capitalize">
            {formType === 'login'
              ? 'Login'
              : formType === 'register'
              ? `Register – Step ${step + 1} of 2`
              : 'Reset Password'}
          </h2>

          {renderStepProgress()}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {/* ───── LOGIN FIELDS ───── */}
          {formType === 'login' && (
            <>
              <input
                type="text"
                placeholder="Username or Email"
                className="input-style"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input-style"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          {/* ───── REGISTER – STEP 0 ───── */}
          {formType === 'register' && step === 0 && (
            <>
              <input
                type="text"
                placeholder="Username"
                className="input-style"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameAvailable(null);
                }}
                onBlur={checkUsername}
                required
              />
              {username && usernameAvailable !== null && (
                <p
                  className={`text-sm ${
                    usernameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {usernameAvailable
                    ? '✅ Username is available'
                    : '❌ Username is taken'}
                </p>
              )}

              <input
                type="email"
                placeholder="Email"
                className="input-style"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input-style"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* business toggle */}
              <div className="flex items-center">
                <input
                  id="isBusiness"
                  type="checkbox"
                  checked={isBusiness}
                  onChange={() => setIsBusiness((b) => !b)}
                  className="mr-2"
                />
                <label htmlFor="isBusiness" className="text-sm">
                  Register as Business
                </label>
              </div>

              <p className="text-xs text-gray-500 text-center mt-1">
                By signing up, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </>
          )}

          {/* ───── REGISTER – STEP 1 ───── */}
          {formType === 'register' && step === 1 && (
            <>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-style"
                required
              >
                <option value="">Select your city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="input-style"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />

              <PhoneInput
                defaultCountry="CA"
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="+1 204 555 6789"
                className="input-style"
              />

              {/* business fields */}
              {isBusiness && (
                <>
                  <input
                    type="text"
                    placeholder="Business Name"
                    className="input-style"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="input-style"
                    required
                  >
                    <option value="">Select Business Type</option>
                    {businessTypes.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt.charAt(0).toUpperCase() + bt.slice(1)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}

          {/* ───── FORGOT PASSWORD ───── */}
          {formType === 'forgot' && (
            <input
              type="email"
              placeholder="Email"
              className="input-style"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {/* ───── BUTTONS ───── */}
          <div className="flex gap-2">
            {formType === 'register' && step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded transition"
            >
              {formType === 'login'
                ? 'Log In'
                : formType === 'register'
                ? step < 1
                  ? 'Next'
                  : 'Sign Up'
                : 'Send Reset Link'}
            </button>
          </div>

          {/* ───── LINKS ───── */}
          <div className="text-xs text-center text-gray-500 space-x-2 mt-4">
            {formType !== 'login' && (
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => {
                  setFormType('login');
                  setStep(0);
                }}
              >
                Back to Login
              </span>
            )}
            {formType !== 'register' && (
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => {
                  setFormType('register');
                  setStep(0);
                }}
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

          {/* ───── SOCIAL ICONS ───── */}
          <div className="flex justify-center items-center gap-4 mt-2">
            <FaGoogle
              size={20}
              className="text-gray-700 cursor-pointer hover:text-orange-500"
            />
            <FaFacebook
              size={20}
              className="text-gray-700 cursor-pointer hover:text-blue-600"
            />
          </div>

          {/* ───── GUEST BUTTON ───── */}
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
