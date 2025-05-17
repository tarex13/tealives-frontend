import React from 'react';
import MediaPreviewCard from './MediaPreviewCard';
import { computeFileHash } from '../utils/fileUtils';

function MediaManager({ mediaFiles, setMediaFiles, openEditor }) {
  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files);
    const newFiles = [];

    for (const file of files) {
      const hash = await computeFileHash(file);
      if (!mediaFiles.some(f => f.hash === hash)) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          editedFile: null,
          caption: '',
          status: 'pending',
          hash,
        });
      }
    }

    setMediaFiles(prev => [...prev, ...newFiles]);
    event.target.value = ''; // Reset file input
  };

  const handleCaptionChange = (id, caption) => {
    setMediaFiles(prev => prev.map(f => f.id === id ? { ...f, caption } : f));
  };

  const handleDelete = (id) => {
    setMediaFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleEdit = (fileObj) => {
    openEditor(fileObj);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
        className="w-full border p-2 rounded mb-4"
      />
      <div className="flex flex-wrap gap-4">
        {mediaFiles.map(fileObj => (
          <MediaPreviewCard
            key={fileObj.id}
            fileObj={fileObj}
            onEdit={() => handleEdit(fileObj)}
            onDelete={() => handleDelete(fileObj.id)}
            onCaptionChange={(caption) => handleCaptionChange(fileObj.id, caption)}
          />
        ))}
      </div>
    </div>
  );
}

export default MediaManager;
