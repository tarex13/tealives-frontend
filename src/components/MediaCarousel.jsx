import React, { useState, useEffect } from 'react';

export default function MediaCarousel({ mediaFiles = [] }) {
    const [current, setCurrent] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (!mediaFiles.length) return null;

    const next = () => setCurrent((current + 1) % mediaFiles.length);
    const prev = () => setCurrent((current - 1 + mediaFiles.length) % mediaFiles.length);

    const openLightbox = () => {
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent scroll
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = 'auto';
    };

    const handleKeyDown = (e) => {
        if (!lightboxOpen) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const getImageUrl = (file) => {
        if (!file) return '';
    
        // Case 1: It's a direct URL string
        if (typeof file === 'string') return file;
    
        // Case 2: It's an object with a 'file_url' key (your case)
        if (typeof file === 'object') {
            if (file.file_url) return file.file_url;
            if (file.url) return file.url;      // Fallback for other conventions
            if (file.file) return file.file;    // Legacy fallback
            if (file instanceof File || file instanceof Blob) {
                return URL.createObjectURL(file); // Correct use of createObjectURL
            }
        }
    
        console.warn('Unhandled media file format:', file);
        return '';
    };

    return (
        <div className="relative w-full mx-auto my-4">
            <div
              className="relative overflow-hidden rounded shadow transition-transform duration-300"
              style={{
                aspectRatio: '16 / 9',
                maxHeight: '400px',
                width: '100%',
              }}
            >
                <img
                loading="lazy"
                    src={getImageUrl(mediaFiles[current])}
                    alt={`Media ${current + 1}`}
                    className="w-full h-full object-cover cursor-pointer transform hover:scale-105 transition-transform duration-300"
                    onClick={openLightbox}
                />
                {mediaFiles.length > 1 && (
                    <>
                        <button 
                            onClick={prev} 
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                        >
                            ‹
                        </button>
                        <button 
                            onClick={next} 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                        >
                            ›
                        </button>
                    </>
                )}
            </div>

            <div className="flex justify-center mt-2">
                {mediaFiles.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-2 w-2 rounded-full mx-1 cursor-pointer transition ${
                            current === idx ? 'bg-blue-600 scale-125' : 'bg-gray-400'
                        }`}
                        onClick={() => setCurrent(idx)}
                    />
                ))}
            </div>

            {lightboxOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                    onClick={closeLightbox}
                >
                    <img
                    loading="lazy"
                        src={getImageUrl(mediaFiles[current])}
                        alt={`Media Full ${current + 1}`}
                        className="max-w-full max-h-full p-4 object-contain"
                    />
                </div>
            )}
        </div>
    );
}
