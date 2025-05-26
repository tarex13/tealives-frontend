import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImageHelper';

export default function ProfileImageUploader({ previewUrl, onImageCropped }) {
  const [preview, setPreview] = useState(previewUrl);
  const [cropping, setCropping] = useState(false);
  const [cropSettings, setCropSettings] = useState({ crop: { x: 0, y: 0 }, zoom: 1, aspect: 1 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // 🔥 Update preview when previewUrl prop changes
  useEffect(() => {
    if (previewUrl) {
      setPreview(previewUrl);
    }
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setCropping(true);
    } else {
      alert('Image must be under 5MB.');
    }
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const cropAndSubmit = async () => {
    if (!preview || !croppedAreaPixels) return;
    const blob = await getCroppedImg(preview, croppedAreaPixels);
    onImageCropped(blob, preview);
    setCropping(false);
  };

  return (
    <div className="text-center mb-6">
      <img
        src={preview || '/default-avatar.png'}
        alt="Profile Preview"
        className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 mx-auto"
      />

      <label className="mt-3 block cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
        {preview ? 'Change Photo' : 'Upload Photo'}
        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      </label>

      {cropping && (
        <div className="relative w-full h-64 my-4 border rounded overflow-hidden dark:border-gray-600">
          <Cropper
            image={preview}
            crop={cropSettings.crop}
            zoom={cropSettings.zoom}
            aspect={1}
            onCropChange={(crop) => setCropSettings((prev) => ({ ...prev, crop }))}
            onZoomChange={(zoom) => setCropSettings((prev) => ({ ...prev, zoom }))}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      {cropping && (
        <button
          onClick={cropAndSubmit}
          className="mt-2 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save Cropped Image
        </button>
      )}
    </div>
  );
}
