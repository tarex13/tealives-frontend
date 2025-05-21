import React, { useState, useEffect } from 'react';

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
        className="w-full h-64 object-cover rounded transition-opacity duration-300 cursor-pointer"
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
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={getImageUrl(media[current])}
            alt={`Zoomed Media ${current + 1}`}
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
}
