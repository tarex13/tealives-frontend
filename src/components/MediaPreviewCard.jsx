// src/components/MediaPreviewCard.jsx
import React, { useMemo, useEffect, useRef } from 'react';

/**
 * Props:
 *   - fileObj: {
 *       id: string,
 *       file: File|null,         // newly selected or replaced file
 *       editedFile: File|null,   // after cropping
 *       url: string|null,        // existing server URL (edit-mode)
 *       caption: string,
 *       status: 'pending'|'edited'|'replaced'|'existing',
 *       hash?: string            // optional, for dedupe
 *     }
 *   - onEdit(fileObj)            // open cropper
 *   - onReplace(newFile: File)   // replace this thumbnail
 *   - onDelete(id: string)       // remove from list
 *   - onCaptionChange(id, text)  // update caption string
 */
export default function MediaPreviewCard({
  fileObj,
  onEdit,
  onDelete,
  onReplace,
  onCaptionChange,
}) {
  const { file, editedFile, url, caption, status } = fileObj;
  const fileInputRef = useRef(null);

  // 1) Determine which source to display:
  //    editedFile (cropped) → file (just-picked) → url (existing) → null
  const displaySource = useMemo(() => {
    if (editedFile instanceof Blob) {
      return URL.createObjectURL(editedFile);
    }
    if (file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    if (url) {
      return url;
    }
    return null;
  }, [editedFile, file, url]);

  // 2) Revoke any created object URLs on cleanup (avoid memory leaks)
  useEffect(() => {
    return () => {
      if (editedFile instanceof Blob) {
        URL.revokeObjectURL(displaySource);
      }
      if (file instanceof Blob && !editedFile) {
        URL.revokeObjectURL(displaySource);
      }
    };
  }, [displaySource, editedFile, file]);

  // 3) If there’s no valid preview, show a placeholder
  if (!displaySource) {
    return (
      <div
        className="relative w-48 border rounded shadow flex items-center justify-center text-gray-500 dark:text-gray-300"
        style={{ aspectRatio: '16 / 9' }}
      >
        No Preview Available
      </div>
    );
  }

  // 4) “Replace” button: triggers a hidden <input type="file">
  const handleReplaceClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // reset so same file can be re-picked
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    const newFile = e.target.files && e.target.files[0];
    if (newFile) {
      onReplace(newFile);
    }
  };

  return (
     <div
      className="relative w-48 border rounded shadow overflow-hidden bg-gray-100 dark:bg-gray-700"
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* Thumbnail */}
      <img
        src={displaySource}
        alt="Preview"
        className="object-cover w-full h-full"
      />

      {/* Overlay Buttons: Crop/Rotate, Replace, Delete */}
      <div className="absolute top-2 right-2 flex gap-1">
        {/* Crop / Rotate */}
        <button
          type="button"
           onClick={() => onEdit(fileObj)}
           >
          ✂️
        </button>

        {/* Replace */}
        <button
          type="button"
          onClick={handleReplaceClick}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          title="Replace Image"
        >
          🔄
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(fileObj.id)}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
          title="Delete Image"
        >
          🗑️
        </button>
      </div>

      {/* “Edited” badge, if applicable */}
      {status === 'edited' && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
          Edited
        </div>
      )}

      {/* Caption input at the bottom */}
{/**      <input
        type="text"
        value={caption}
        onChange={(e) => onCaptionChange(fileObj.id, e.target.value)}
        placeholder="Add Caption (Optional)"
        className="absolute bottom-0 left-0 w-full p-1 border-t bg-white text-sm focus:outline-none"
      />*/}
    </div>
  );
}
