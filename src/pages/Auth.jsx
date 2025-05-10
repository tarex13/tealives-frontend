import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../requests';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import '../css/auth.css'; // Your existing CSS remains untouched

function AuthForm() {
  const [formType, setFormType] = useState('login'); // 'login', 'register', 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (formType === 'login') {
        const data = await login({ username, password });
        loginUser({ access: data.access, refresh: data.refresh, user: data.user });
        navigate('/');
      } else if (formType === 'register') {
        await register({ username, password, email });
        setFormType('login');
      } else if (formType === 'forgot') {
        alert('Password reset instructions have been sent to your email.');
        setFormType('login');
      }
    } catch (err) {
      console.error(`${formType} failed:`, err);
      setError('Something went wrong. Please try again.');
    }
  };

  const switchForm = (type) => {
    setError(null);
    setFormType(type);
  };

  return (
    <div id="form">
      <div id="form">
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="across"></div>
        <div className="sign "><label  style={{ cursor: 'text' }}>Tealives</label></div>

        <div className="form-slider">
          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className={`form-section login ${formType === 'login' ? 'active' : ''}`}
          >
            <h1 className="ln-lbl text-xl font-semibold mb-4">Login</h1>

            <label className="block mb-2">
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <label className="block mb-4">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition">
              Log In
            </button>

            <div className="fp" onClick={() => switchForm('forgot')} style={{ cursor: 'pointer' }}>
              Reset Password?
            </div>

            <div className="signup">
              <label onClick={() => switchForm('register')}>
                Don't have an account? <b  style={{ cursor: 'pointer' }} className="text-blue-400 ">Sign Up</b>
              </label>
              <div className="alt_signup_cont">
              Or Login With 
                <div className="alt_signup">
                    
                  <FaGoogle size={30} /> <FaFacebook  size={30} />
                </div>
              </div>
            </div>
          </form>

          {/* Register Form */}
          <form
            onSubmit={handleSubmit}
            className={`form-section register ${formType === 'register' ? 'active' : ''}`}
            
          >
            <h1 className="ln-lbl text-xl font-semibold mb-4">Register</h1>

            <label className="block mb-2">
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <label className="block mb-2">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <label className="block mb-4">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition">
              Sign Up
            </button>

            <div className="signup fp">
              <label onClick={() => switchForm('login')}>
                Already have an account? <b style={{ cursor: 'pointer' }}>Login</b>
              </label>
            </div>
          </form>

          {/* Forgot Password Form */}
          <form
            onSubmit={handleSubmit}
            className={`form-section forgot ${formType === 'forgot' ? 'active forgot-adjust' : ''}`}
          >
            <h1 className="ln-lbl text-xl font-semibold mb-4">Forgot Password</h1>

            <label className="block mb-4">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full border p-2 mt-1 rounded"
                required
              />
            </label>

            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition">
              Send Reset Link
            </button>

            <div className="signup">
              <label onClick={() => switchForm('login')} style={{ cursor: 'pointer' }}>
                Back to <b>Login</b>
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
