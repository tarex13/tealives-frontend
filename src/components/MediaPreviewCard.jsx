import React, { useMemo, useEffect } from 'react';

function MediaPreviewCard({ fileObj, onEdit, onDelete, onCaptionChange }) {
  const { file, editedFile, caption, status } = fileObj;
  const displayFile = editedFile || file;

  const imageUrl = useMemo(() => {
    if (displayFile instanceof Blob) {
      return URL.createObjectURL(displayFile);
    }
    return null;
  }, [displayFile]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="relative w-48 h-48 border rounded shadow flex items-center justify-center text-gray-500">
        No Preview Available
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48 border rounded shadow overflow-hidden">
      <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
      <div className="absolute top-2 right-2 flex gap-1">
        <button onClick={onEdit} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
        <button onClick={onDelete} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
      </div>
      {status === 'edited' && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
          Edited
        </div>
      )}
      <input
        type="text"
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Add Caption (Optional)"
        className="w-full p-1 border-t text-sm"
      />
    </div>
  );
}

export default MediaPreviewCard;
