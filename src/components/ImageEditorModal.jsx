// src/components/ImageEditorModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from '../utils/cropImageUtils'; // your helper

function ImageEditorModal({ fileObj, onSave, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [caption, setCaption] = useState(fileObj.caption || '');

  // 1) Build the source URL:
  const imageSrc = useMemo(() => {
    if (fileObj.editedFile instanceof Blob) {
      return URL.createObjectURL(fileObj.editedFile);
    }
    if (fileObj.file instanceof Blob) {
      return URL.createObjectURL(fileObj.file);
    }
    if (fileObj.url) {
      return fileObj.url;
    }
    return null;
  }, [fileObj]);

  // 2) Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (fileObj.editedFile instanceof Blob) {
        URL.revokeObjectURL(imageSrc);
      }
      if (fileObj.file instanceof Blob && !fileObj.editedFile) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [fileObj, imageSrc]);

  if (!imageSrc) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center text-white text-lg">
        Unable to load image preview.
        <button onClick={onClose} className="ml-4 underline">
          Close
        </button>
      </div>
    );
  }

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      // Pass rotation/flip to your helper
      const blob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        fileObj.file?.type || 'image/png',
        rotation,
        flip
      );
      const editedFile = new File(
        [blob],
        fileObj.file?.name || 'cropped.png',
        { type: fileObj.file?.type || 'image/png' }
      );
      onSave({
        ...fileObj,
        editedFile,
        caption,
        status: 'edited',
      });
    } catch (err) {
      console.error('Error during image processing:', err);
    }
  };

  const resetEdits = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlip(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-96 bg-white rounded shadow-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          objectFit="horizontalCover"
          transform={{
            scaleX: flip ? -1 : 1,
          }}
        />
      </div>

      {/* Caption Input */}
      <div className="w-full max-w-lg mt-4">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (Optional)"
          className="w-full border p-2 rounded mb-2 text-sm"
        />
      </div>

      {/* Zoom Slider */}
      <div className="w-full max-w-lg">
        <Slider
          value={zoom}
          min={1}
          max={5}
          step={0.1}
          onChange={(e, value) => setZoom(value)}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Rotate
        </button>
        <button
          onClick={() => setFlip((f) => !f)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Flip
        </button>
        <button
          onClick={resetEdits}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ImageEditorModal;
