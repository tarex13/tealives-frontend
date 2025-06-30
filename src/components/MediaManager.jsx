import React, { useRef } from 'react';
import MediaPreviewCard from './MediaPreviewCard';
import { computeFileHash } from '../utils/fileutils';

export default function MediaManager({
  mediaFiles,
  setMediaFiles,
  openEditor,
  vid = false,
}) {
  const MAX_MEDIA_FILES = 5;
  const fileInputRef = useRef(null);

  // 1) Dedupe + add selected files
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

    if (newFiles.length) {
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }

    // allow re-selecting the same file if needed
    event.target.value = '';
  };

  // 2) Update caption
  const handleCaptionChange = (id, caption) => {
    setMediaFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, caption } : f))
    );
  };

  // 3) Delete a file/video
  const handleDelete = (id) => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 4) Replace an existing file/video
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
              hash: null,
            }
          : f
      )
    );
    // immediately open editor on replaced file
    const replaced = mediaFiles.find((f) => f.id === id);
    if (replaced) {
      openEditor({
        ...replaced,
        file: newFile,
        url: null,
        editedFile: null,
      });
    }
  };

  return (
    <div>
      {/* Add files/videos if under limit */}
      {mediaFiles.length < MAX_MEDIA_FILES && (
        <input
          ref={fileInputRef}
          type="file"
          accept={
            vid
              ? '.jpg,.jpeg,.png,.gif,.mp4,.mov'
              : 'image/jpeg,image/png,image/webp'
          }
          multiple
          onChange={handleFilesSelected}
          className="w-full border p-2 rounded mb-4"
        />
      )}

      {/* Render previews for both images and videos */}
      <div className="flex flex-wrap gap-4">
        {mediaFiles.map((fileObj) => (
          <MediaPreviewCard
            key={fileObj.id}
            fileObj={fileObj}
            onEdit={openEditor}
            onDelete={() => handleDelete(fileObj.id)}
            onReplace={(newFile) => handleReplace(fileObj.id, newFile)}
            onCaptionChange={(caption) =>
              handleCaptionChange(fileObj.id, caption)
            }
          />
        ))}
      </div>
    </div>
  );
}
