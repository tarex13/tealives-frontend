// src/components/MediaManager.jsx
import React, { useRef } from 'react';
import MediaPreviewCard from './MediaPreviewCard';
import { computeFileHash } from '../utils/fileutils';

function MediaManager({ mediaFiles, setMediaFiles, openEditor }) {
  const MAX_MEDIA_FILES = 5;
  const fileInputRef = useRef(null);

  // 1) Handle newly selected files (dedupe by hash)
  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files);
    const newFiles = [];

    for (const file of files) {
      const hash = await computeFileHash(file);
      if (!mediaFiles.some((f) => f.hash === hash)) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          url: null,
          editedFile: null,
          caption: '',
          status: 'pending',
          hash,
        });
      }
    }

    if (newFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
    event.target.value = ''; // Reset input so same file can be re-picked
  };

  // 2) Caption change
  const handleCaptionChange = (id, caption) => {
    setMediaFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, caption } : f))
    );
  };

  // 3) Delete image
  const handleDelete = (id) => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 4) When user clicks “Edit (Crop/Rotate)”
  const handleEdit = (fileObj) => {
    openEditor(fileObj);
  };

  // 5) Replace: When the user picks a new file for an existing thumbnail
  const handleReplace = (id, newFile) => {
    setMediaFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              file: newFile,
              url: null,
              editedFile: null,
              status: 'replaced',
              hash: null, // or recompute if you want to prevent duplicates
            }
          : f
      )
    );

    // Immediately open the editor on that replaced file
    const replacedObj = mediaFiles.find((f) => f.id === id);
    if (replacedObj) {
      openEditor({
        ...replacedObj,
        file: newFile,
        url: null,
        editedFile: null,
      });
    }
  };

  return (
    <div>
      {/* Only show “Add Image” if below max-files limit */}
      {mediaFiles.length < MAX_MEDIA_FILES && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilesSelected}
          className="w-full border p-2 rounded mb-4"
        />
      )}

      <div className="flex flex-wrap gap-4">
        {mediaFiles.map((fileObj) => (
          <MediaPreviewCard
            key={fileObj.id}
            fileObj={fileObj}
            onEdit={handleEdit}
            onDelete={() => handleDelete(fileObj.id)}
            onReplace={(newFile) => handleReplace(fileObj.id, newFile)}
            onCaptionChange={(caption) => handleCaptionChange(fileObj.id, caption)}
          />
        ))}
      </div>
    </div>
  );
}

export default MediaManager;
