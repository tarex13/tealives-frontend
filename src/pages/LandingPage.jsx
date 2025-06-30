import React, { useState, useEffect } from 'react';
import { Link }            from 'react-router-dom';
import { Helmet }          from 'react-helmet-async';
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
    const id = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return <div className="launch-live">We’re Live! 🎉</div>;
  }

  return (
    <div className="countdown-grid">
      {['days','hours','minutes','seconds'].map((unit) => (
        <div key={unit} className="count-card p-[0.1rem] md:p-[1rem] text-base md:text-xl">
          <div className="count-number">
            {String(timeLeft[unit]).padStart(2,'0')}
          </div>
          <div className="count-label">{unit}</div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const collageImages = [
    'shot-event',
    'shot-profile',
    'shot-feed',
    'shot-listing',
  ];

  const reactions = [
    { emoji: '👍', count: 0 },
    { emoji: '❤️', count: 0 },
    { emoji: '😂', count: 0 },
    { emoji: '🔥', count: 0 },
  ];

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance
  useEffect(() => {
    const count = collageImages.length;
    const iv = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % count);
    }, 4000);
    return () => clearInterval(iv);
  }, [collageImages.length]);

  const prevSlide = () =>
    setCurrentSlide((s) =>
      (s - 1 + collageImages.length) % collageImages.length
    );
  const nextSlide = () =>
    setCurrentSlide((s) => (s + 1) % collageImages.length);

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
            <br />
            Join Conversations, Events & Marketplaces.
          </p>
          <div className="glass-card">
            <h2>Login Opens In</h2>
            <CountdownTimer />

            <div className="emoji-reactions">
              {reactions.map((r,i) => (
                <div key={i} className="reaction-bubble">
                  {r.emoji} <span>{r.count}</span>
                </div>
              ))}
            </div>

            <p>
              Full access & logins open July 1 (Canada Day). Until then,&nbsp;
              <Link to="/auth?formType=register">sign up</Link> to join the waitlist!!!
            </p>
          </div>

          <Link to="/auth?formType=register" className="btn-primary">
            Sign Up
          </Link>
        </div>

        {/* Custom Responsive Slider */}
        <div className="slider-container">
          {collageImages.map((name, idx) => (
            <img
              key={name}
              src={`/${name}.png`}
              alt={`Screenshot: ${name.replace(/-/g,' ')}`}
              className={
                idx === currentSlide
                  ? 'slider-image active'
                  : 'slider-image'
              }
              loading="lazy"
            />
          ))}
          <button className="slider-prev" onClick={prevSlide}>
            ‹
          </button>
          <button className="slider-next" onClick={nextSlide}>
            ›
          </button>
        </div>
      </section>

      {/* Moderator Recruitment */}
      <section className="mod-section">
        <h2>Become a City Moderator</h2>
        <p>
          Help us keep your city feed safe, friendly, and on-point. As a moderator you’ll:
        </p>
        <ul>
          {[
            'Review & approve posts, alerts & groups',
            'Manage event RSVPs & waitlists',
            'Assign badges & handle reports',
            'Foster positive community engagement',
            'Earn mod XP & exclusive badges',
            'Access a private mod dashboard',
          ].map((item,i) => (
            <li key={i}>
              <span>🛡️</span> <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Link to="/mod/apply" className="btn-secondary">
            Apply to Become a Moderator
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="footer">
        <h2>Ready to Connect with Your City?</h2>
        <Link to="/auth?formType=register" className="btn-primary">
          Join Tealives Today
        </Link>
        <p>Built in Canada | Full logins start July 1, 2025</p>
      </footer>
    </div>
  );
}
