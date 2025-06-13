import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function MarketplaceCarousel({ media = [] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = () => setCurrent((current + 1) % media.length);
  const prev = () => setCurrent((current - 1 + media.length) % media.length);

  const getImageUrl = (file) => {
    if (!file) return '';
    if (typeof file === 'string') return file;
    if (file.file_url) return file.file_url;
    if (file.url) return file.url;
    if (file.file) return file.file;
    if (file instanceof File) return URL.createObjectURL(file);
    return '';
  };

  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (!media.length) return null;

  return (
    <div className="relative">
      <img
        src={getImageUrl(media[current])}
        alt={`Media ${current + 1}`}
        className="w-full aspect-[4/3] object-cover rounded transition-opacity duration-300"
        onClick={() => setLightboxOpen(true)}
        loading="lazy"
      />

      {media.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next image"
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
      {/* ─── Always-visible close button ───────────────────────────── */}
      <button
        onClick={() => setLightboxOpen(false)}
        className="
          absolute top-2 right-2
          p-2 rounded-full
          bg-gray-800 z-10
          text-white text-2xl
          focus:outline-none focus:ring-2 focus:ring-white
          transition-opacity duration-200
        "
      >
        <FaTimes />
      </button>
      

      {/* the image */}
     <img
        src={getImageUrl(media[current])}
        alt={`Zoomed Media ${current + 1}`}
       className="max-w-full max-h-full rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300"
      />


      {/* optional caption */}
      {media[current].caption && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded">
          {media[current].caption}
        </div>
      )}
    </div>
    </div>
      )}
    </div>
  );
}
