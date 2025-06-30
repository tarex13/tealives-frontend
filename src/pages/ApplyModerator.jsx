// src/pages/ApplyModerator.jsx
import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { useNotification }  from '../context/NotificationContext';
import api                  from '../api';
import '../css/Landing.css'; // for the blob & background styles
import { Helmet } from 'react-helmet-async';
import { useCity } from '../context/CityContext';
export default function ApplyModerator() {
  const navigate = useNavigate();
const { cities, city: City } = useCity();
  const [city, setCity] = useState(City);
  const { showNotification } = useNotification();

  // Form state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name:        '',
    email:            '',
    desired_username: '',
    city:             city,
    why:              '',
    suggest:          '',
    time_commitment:  '',
    past_experience:  '',
    fun_fact:         '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('apply/moderator/', form);
      showNotification('Application submitted! Thanks for volunteering.','success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to submit—please try again.','error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
              <Helmet>
                <title>Tealives – Your City, Your Community</title>
              </Helmet>
      {/* Background blobs */}
      <div className="blob blob1" />
      <div className="blob blob2" />

      <div className="w-full max-w-2xl bg-gray-600 backdrop-blur-lg border border-white/30 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-2">
          🛡️ Join the Mod Team
        </h1>
        <p className="text-center text-indigo-100 mb-6">
          Help us keep Tealives safe, friendly, and fun!
        </p>

        {/* Multi-step form */}
        {step === 1 && (
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Desired Username</label>
              <input
                name="desired_username"
                value={form.desired_username}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Make sure you’ve created your account first"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">City</label>
                <select
                id="city"
                value={form.city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 border-2 border-indigo-300 text-indigo-300 rounded-md font-semibold hover:bg-indigo-300 hover:text-white transition"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-white">
                Why do you want to be a Mod?(Answer Freely)
              </label>
              <textarea
                name="why"
                rows="3"
                value={form.why}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
Imagine an app that truly keeps your community connected—no hopping between five different services just to share a ride, find a job, or borrow a tool. What one feature (or two!) would you absolutely need to feel 100% plugged in to your neighborhood?
              </label>
              <textarea
                name="suggest"
                rows="3"
                value={form.suggest}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">
                  Time Commitment
                </label>
                <input
                  name="time_commitment"
                  value={form.time_commitment}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. A few hrs/week or whenever I can"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">
                  Past Experience (optional)
                </label>
                <textarea
                  name="past_experience"
                  rows="2"
                  value={form.past_experience}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Fun Fact (optional)</label>
              <input
                name="fun_fact"
                value={form.fun_fact}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 rounded-md bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <p className="text-xs text-indigo-200">
              * Selection not guaranteed — we’ll review all applications and be in touch!
            </p>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border-2 border-indigo-300 text-indigo-300 rounded-md font-semibold hover:bg-indigo-300 hover:text-white transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-3 border-2 border-indigo-300 text-indigo-300 rounded-md font-semibold hover:bg-indigo-300 hover:text-white transition"
              >
                Send My Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
