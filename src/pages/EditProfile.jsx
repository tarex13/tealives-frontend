import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import api from '../api'; // Adjust path based on your project structure
import { useAuth } from '../context/AuthContext';
import getCroppedImg from '../utils/cropImageHelper'; // We will define this helper next

function EditProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ bio: '', city: '', profile_image: null, preview: null });
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cropSettings, setCropSettings] = useState({ crop: { x: 0, y: 0 }, zoom: 1, aspect: 1 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await api.get('user/profile/');
      setForm({
        ...res.data,
        profile_image: null,
        preview: res.data.profile_image_url || null,
      });
    };
    loadProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setForm({ ...form, profile_image: file, preview: URL.createObjectURL(file) });
      setCropping(true);
    } else {
      alert('Please upload an image smaller than 5MB.');
    }
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const uploadCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(form.preview, croppedAreaPixels);
      const formData = new FormData();
      formData.append('bio', form.bio);
      formData.append('city', form.city);
      formData.append('profile_image', croppedImageBlob, 'cropped_image.jpg');

      setSubmitting(true);
      await api.put('user/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setSubmitting(false);
      setCropping(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 shadow rounded mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Edit Your Profile</h1>

      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">🎉 Profile updated!</div>}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <input
          name="city"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="City"
          className="w-full border p-2 rounded"
        />

        <textarea
          name="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          className="w-full border p-2 rounded h-32"
        />

        <label className="block w-full p-4 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
          <span className="text-gray-600">
            {form.preview ? 'Change Profile Picture' : 'Click to Upload Profile Picture'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        {cropping && form.preview && (
          <div className="relative w-full h-64 bg-gray-100">
            <Cropper
              image={form.preview}
              crop={cropSettings.crop}
              zoom={cropSettings.zoom}
              aspect={1}
              onCropChange={(crop) => setCropSettings((prev) => ({ ...prev, crop }))}
              onZoomChange={(zoom) => setCropSettings((prev) => ({ ...prev, zoom }))}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        {(
          <button
            className="btn bg-green-600 text-white px-4 py-2 rounded w-full mt-4"
            onClick={uploadCroppedImage}
            disabled={submitting}
          >
            {submitting ? 'Uploading...' : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  );
}

export default EditProfile;
