// src/components/ImageEditorModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from '../utils/cropImageUtils';

export default function ImageEditorModal({ fileObj, onSave, onClose }) {
  // — 1) Guard against missing props
  if (!fileObj) {
    console.warn('ImageEditorModal mounted without fileObj');
    return null;
  }

  // — 2) Pull off any previously-saved crop data (if the parent passed it back)
  const {
    caption: initialCaption = '',
    crop: initialCropProp,
    zoom: initialZoomProp,
    rotation: initialRotationProp,
    flip: initialFlipProp,
    editedFile,
    url,
    file,
  } = fileObj;

  const initialCrop = initialCropProp ?? { x: 0, y: 0 };
  const initialZoom = initialZoomProp ?? 1;
  const initialRotation = initialRotationProp ?? 0;
  const initialFlip = initialFlipProp ?? false;

  // — 3) Local state
  const [caption, setCaption] = useState(initialCaption);
  const [crop, setCrop] = useState(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(initialRotation);
  const [flip, setFlip] = useState(initialFlip);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // — 4) Build the <img> source: if we've already saved an editedFile, use that;
  //       otherwise fall back to the original Blob/url
  const sourceFile = file ?? editedFile;
  const [imageSrc, setImageSrc] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const src = sourceFile instanceof Blob
      ? URL.createObjectURL(sourceFile)
      : url;
    setImageSrc(src);
    return () => {
      if (sourceFile instanceof Blob) {
        URL.revokeObjectURL(src);
      }
    };
  }, [sourceFile, url]);

  // — 5) Bail if we still have no image
  if (!imageSrc) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center text-white text-lg">
        Unable to load image preview.
        <button
          type="button"
          onClick={onClose}
          className="ml-4 underline"
        >
          Close
        </button>
      </div>
    );
  }

  // — 6) Fit the full image **only on first load** (skip if the parent gave us a zoom)
  const onMediaLoaded = ({ width: imgW, height: imgH }) => {
    if (!containerRef.current) return;
    // if parent passed back a zoom value, assume that was intentional
    if (initialZoomProp != null) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    setZoom(Math.min(cw / imgW, ch / imgH));
  };

  // — 7) Track final crop box
  const onCropComplete = (_, pixels) => {
    setCroppedAreaPixels(pixels);
  };

  // — 8) Save: generate the new blob **and** send _all_ of our state back up
  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        sourceFile?.type || 'image/png',
        rotation,
        flip
      );
      const newFile = new File(
        [blob],
        sourceFile?.name ?? 'cropped.png',
        { type: sourceFile?.type || 'image/png' }
      );

      onSave({
        ...fileObj,
        // this becomes our next `editedFile`
        editedFile: newFile,
        // keep the URL around for non-Blob cases
        url: undefined,
        caption,
        status: 'edited',
        // persist your crop settings…
        crop,
        zoom,
        rotation,
        flip,
      });
    } catch (err) {
      console.error('Error generating cropped image:', err);
    }
  };

  // — 9) Reset
  const resetEdits = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlip(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
      {/* Cropping frame */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg h-96 bg-white rounded shadow-lg overflow-hidden"
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: flip ? 'scaleX(-1)' : 'none',
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            showGrid={false}
            objectFit="contain"
          />
        </div>
      </div>

      {/* Caption */}
      <div className="w-full max-w-lg mt-4">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (Optional)"
          className="w-full border p-2 rounded mb-2 text-sm"
        />
      </div>

      {/* Zoom slider */}
      <div className="w-full max-w-lg pointer-events-auto">
        <Slider
          value={zoom}
          min={1}
          max={5}
          step={0.1}
          aria-label="Zoom"
          onChange={(_, v) => {
            const val = Array.isArray(v) ? v[0] : v;
            setZoom(val);
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Rotate
        </button>
        <button
          type="button"
          onClick={() => setFlip((f) => !f)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Flip
        </button>
        <button
          type="button"
          onClick={resetEdits}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
