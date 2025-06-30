// src/components/MarketplaceCarousel.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function MarketplaceCarousel({ media = [] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = () => setCurrent((current + 1) % media.length);
  const prev = () => setCurrent((current - 1 + media.length) % media.length);

  // decide URL to use
  const getMediaUrl = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (item.file_url) return item.file_url;
    if (item.url) return item.url;
    if (item.file) {
      // blob-URL for File objects
      if (item.file instanceof File) return URL.createObjectURL(item.file);
      return item.file;
    }
    return '';
  };

  // is this a video?
  const isVideo = (item) => {
    if (item.is_video === true) return true;
    if (item.file instanceof File && item.file.type.startsWith('video/')) return true;
    // fallback: check extension
    const u = getMediaUrl(item);
    return /\.(mp4|mov|webm)$/i.test(u);
  };

  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : 'auto';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [lightboxOpen, current]);

  if (!media.length) return null;
  const item = media[current];
  const src = getMediaUrl(item);
  const vid = isVideo(item);

  return (
    <div className="relative">
      {vid ? (
        <video
          src={src}
          controls
          className="w-full aspect-[4/3] object-cover rounded transition-opacity duration-300 cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        />
      ) : (
        <img
          src={src}
          alt={`Media ${current + 1}`}
          className="w-full aspect-[4/3] object-cover rounded transition-opacity duration-300 cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          loading="lazy"
        />
      )}

      {media.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
          >
            ›
          </button>
        </>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-[90%] max-h-[90%] flex items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => vid && setLightboxOpen(false) }
              className="absolute top-2 right-2 p-2 rounded-full bg-gray-800 z-10 text-white text-2xl focus:outline-none focus:ring-2 focus:ring-white transition-opacity duration-200"
            >
              <FaTimes />
            </button>

            {vid ? (
              <video
                src={src}
                controls
                poster={item.preview || ''}
                className="max-w-full max-h-full rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <img
                src={src}
                alt={`Zoomed Media ${current + 1}`}
                className="max-w-full max-h-full rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300"
              />
            )}

            {item.caption && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded">
                {item.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
