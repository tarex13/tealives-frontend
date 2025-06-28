// src/components/EventCard.jsx
import React, { useState } from 'react';
import { toggleRSVP, notInterestedEvent } from '../requests';
import { useAuth } from '../context/AuthContext';
import {
  FaCalendarAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaEnvelope,
  FaPhone,
  FaTag,
  FaUserShield,
} from 'react-icons/fa';

export default function EventCard({ event }) {
  const { user } = useAuth();

  // use annotated fields instead of full RSVP list
  const [hasRSVPed, setHasRSVPed] = useState(event.has_rsvped);
  const [rsvpCount, setRsvpCount]   = useState(event.rsvp_count);
  const [hidden, setHidden]         = useState(false);
  const isFull                      = event.is_full;

  const handleRSVP = async () => {
    if (isFull && !hasRSVPed) return;
    try {
      await toggleRSVP(event.id);
      if (hasRSVPed) {
        setHasRSVPed(false);
        setRsvpCount(c => Math.max(0, c - 1));
      } else {
        setHasRSVPed(true);
        setRsvpCount(c => c + 1);
      }
    } catch (err) {
      console.error('Failed to toggle RSVP:', err);
    }
  };

  const handleNotInterested = async () => {
    await notInterestedEvent(event.id);
    setHidden(true)
  };
  if (hidden) return null;

  // color-coded count
  const countColor =
    rsvpCount < 5 ? 'text-gray-600' :
    rsvpCount < 15 ? 'text-blue-600' :
    'text-green-600';

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden h-full transition-transform hover:scale-[1.02] duration-200">
      {/* Banner with full badge */}
      {event.banner_url && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {isFull && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              FULL
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col flex-grow p-5 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center text-indigo-600 dark:text-indigo-300 space-x-1 text-sm uppercase font-semibold">
            <FaCalendarAlt /> <span>Event</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(event.datetime).toLocaleString()}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {event.description || <em className="text-gray-400">No description provided.</em>}
        </p>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {event.category && (
            <span className="bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-white text-xs font-medium px-3 py-0.5 rounded-full">
              {event.category}
            </span>
          )}
          {Array.isArray(event.tags) && event.tags.length > 0 && event.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-xs px-2 py-0.5 rounded-full"
            >
              <FaTag className="text-xs" /> {tag}
            </span>
          ))}
        </div>

        {/* Location & Age */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {event.location && <span>📍 {event.location}</span>}
          {event.minimum_age && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <FaUserShield /> {event.minimum_age}+
            </span>
          )}
        </div>

        {/* External Link & Contacts */}
        <div className="flex flex-col space-y-2">
          {event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              <FaExternalLinkAlt /> Event Page
            </a>
          )}
          {(event.contact_email || event.contact_phone) && (
            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {event.contact_email && (
                <span className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-500 dark:text-gray-400" /> {event.contact_email}
                </span>
              )}
              {event.contact_phone && (
                <span className="flex items-center gap-2">
                  <FaPhone className="text-gray-500 dark:text-gray-400" /> {event.contact_phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRSVP}
            disabled={isFull && !hasRSVPed}
            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition ${
              hasRSVPed
                ? 'bg-red-600 hover:bg-red-700'
                : isFull
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {hasRSVPed ? <><FaTimesCircle /> Cancel RSVP</> : <><FaCheckCircle /> RSVP</>}
          </button>

          <button
            onClick={handleNotInterested}
            className="flex-1 flex justify-center items-center py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium transition"
          >
            Not Interested
          </button>

          <span className={`ml-auto text-sm font-medium ${countColor}`}>
            {rsvpCount} attending
          </span>
        </div>
      </div>
    </div>
  );
}
