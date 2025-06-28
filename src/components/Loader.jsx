import React from 'react';
import '../css/Loader.css';

export default function Loader({ visible }) {
  if (!visible) return null;
  return (
    <div className="loader-overlay">
      <div className="loader-logo">Tealives</div>
    </div>
  );
}
