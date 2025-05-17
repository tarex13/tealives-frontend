import React, { useState } from 'react';

function MarketplaceCarousel({ media = [], price }) {
  const [current, setCurrent] = useState(0);

  if (media.length === 0) return null;

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % media.length);
  };

  return (
    <div>
      {/* Large Preview */}
      <div className="relative w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center mb-4" style={{maxHeight: '400px'}}>

        {media[current]?.is_video ? (
          <video src={media[current].file} controls className="max-h-full max-w-full object-contain" />
        ) : (
          <img src={media[current].file} alt="Marketplace Item" className="max-h-full max-w-full object-contain" />
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2 justify-center"  style={{position: 'relative'}}>
      <div style={{
              position: 'absolute',
              right: '0px',
              color: '#1e2939',
              backgroundColor: '#f9fafb',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.5vw',
              top: '0',
              padding: '0.2vw',}}
>Price: ${price}</div>
        {media.map((item, idx) => (
          <img
            key={idx}
            src={item.file}
            alt="Thumbnail"
            className={`w-20 h-20 object-cover border-2 rounded cursor-pointer ${
              current === idx ? 'border-blue-500' : 'border-gray-300'
            }`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
}

export default MarketplaceCarousel;
