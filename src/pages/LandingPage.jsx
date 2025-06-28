import React, { useState, useEffect } from 'react';
import { Link }                        from 'react-router-dom';
import { Helmet }                      from 'react-helmet-async';
import '../css/Landing.css';

const LAUNCH_DATE = new Date('2025-07-01T00:00:00-05:00');

function CountdownTimer() {
  const calculate = () => {
    const now  = new Date();
    const diff = LAUNCH_DATE - now;
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculate());
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!timeLeft) {
    return <div className="launch-live">We’re Live! 🎉</div>;
  }

  return (
    <div className="countdown-grid">
      {['days','hours','minutes','seconds'].map(unit => (
        <div key={unit} className="count-card">
          <div className="count-number">{String(timeLeft[unit]).padStart(2,'0')}</div>
          <div className="count-label">{unit}</div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const collageImages = [
    'shot-event',
    'discussion-post',
    'event-details',
    'shot-listing'
  ];

  const reactions = [
    { emoji: '👍', count: 0 },
    { emoji: '❤️', count: 0 },
    { emoji: '😂', count: 0 },
    { emoji: '🔥', count: 0 },
  ];

  return (
    <div className="landing-wrapper">
      {/* Background blobs */}
      <div className="blob blob1" />
      <div className="blob blob2" />
      {/* Floating emoji blobs */}
      <div className="emoji-blob emoji-1">📆</div>
      <div className="emoji-blob emoji-2">🍁</div>

      <Helmet>
        <title>Tealives – Your City, Your Community</title>
      </Helmet>

      {/* Hero + Countdown */}
      <section className="parallax">
        <div className="hero-content">
          <h1>Tealives</h1>
          <p>
            Life’s Happening in Your City.
Join Conversations, Events & Marketplaces.
          </p>
          <div className="glass-card">
            <h2>Login Opens In</h2>
            <CountdownTimer />

            {/* New reactions bar */}
            <div className="emoji-reactions">
              {reactions.map((r, i) => (
                <div key={i} className="reaction-bubble">
                  {r.emoji} <span>{r.count}</span>
                </div>
              ))}
            </div>

            <p>
              Full access & logins open July 1 (Canada Day). Until then,&nbsp;
              <Link to="/register">sign up</Link> for early access!
            </p>
          </div>

          {/* Sign up CTA */}
          <Link to="/register" className="btn-primary">
            Sign Up
          </Link>
        </div>

        {/* Responsive collage */}
        <div className="collage-container">
          {collageImages.map((name,i) => (

              <img
                src={`/${name}.png`}
                alt={`Screenshot: ${name.replace('-',' ')}`}
                className="collage-item"
                loading="lazy"
              />
          ))}
        </div>
      </section>
     {/* Moderator Recruitment */}
      <section className="py-16 bg-gray-50 px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Become a City Moderator</h2>
        <p className="text-center text-lg max-w-2xl mx-auto mb-8">
          Help us keep your city feed safe, friendly, and on-point. As a moderator you’ll:
        </p>
        <ul className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {[
            'Review & approve posts, alerts & groups',
            'Manage event RSVPs & waitlists',
            'Assign badges & handle reports',
            'Foster positive community engagement',
            'Earn mod XP & exclusive badges',
            'Access a private mod dashboard',
          ].map((item,i) => (
            <li key={i} className="flex items-start space-x-3">
              <span className="text-2xl">🛡️</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Link
            to="/register?role=moderator"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Apply to Become a Moderator
          </Link>
        </div>
      </section>
      

      {/* CTA Footer */}
      <footer className="footer">
        <h2>Ready to Connect with Your City?</h2>
        <Link to="/register" className="btn-primary">Join Tealives Today</Link>
        <p>Built in Canada 🇨🇦 | Full logins start July 1, 2025</p>
      </footer>
    </div>
  );
}
