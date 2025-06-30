// src/components/MediaPreviewCard.jsx
import React, { useMemo, useRef } from 'react';

/**
 * Props:
 *   - fileObj: {
 *       id: string,
 *       file: File|null,
 *       editedFile: File|null,
 *       url: string|null,
 *       caption: string,
 *       status: 'pending'|'edited'|'replaced'|'existing',
 *       hash?: string
 *     }
 *   - onEdit(fileObj)            // open cropper (images only)
 *   - onReplace(newFile: File)   // replace this thumbnail/video
 *   - onDelete(id: string)       // remove from list
 *   - onCaptionChange(id, text)  // update caption string (if re-enabled)
 */
export default function MediaPreviewCard({
  fileObj,
  onEdit,
  onDelete,
  onReplace,
  onCaptionChange,
}) {
  const { file, editedFile, url, status } = fileObj;
  const fileInputRef = useRef(null);

  // 1) Decide which source to show
  const displaySource = useMemo(() => {
    if (editedFile instanceof Blob) return URL.createObjectURL(editedFile);
    if (file instanceof Blob) return URL.createObjectURL(file);
    if (url) return url;
    return null;
  }, [editedFile, file, url]);

  // 2) Detect video vs image
  const mimeType = (editedFile || file)?.type || '';
  const isVideo = mimeType.startsWith('video/');

  // 3) No more auto-cleanup here (we only revoke on delete/replace)

  // 4) Placeholder
  if (!displaySource) {
    return (
      <div
        className="relative w-48 border rounded shadow flex items-center justify-center text-gray-500 dark:text-gray-300"
        style={{ aspectRatio: '16 / 9' }}
      >
        No Preview
      </div>
    );
  }

  // 5) Replace click
  const handleReplaceClick = () => {
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };
  const handleFileInputChange = (e) => {
    const newFile = e.target.files?.[0];
    if (newFile) onReplace(newFile);
  };

  return (
    <div
      className="relative w-48 border rounded shadow overflow-hidden bg-gray-100 dark:bg-gray-700"
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* Media Preview */}
      {isVideo ? (
        <video
          src={displaySource}
          controls
          className="object-cover w-full h-full"
        />
      ) : (
        <img
          src={displaySource}
          alt="Preview"
          className="object-cover w-full h-full"
        />
      )}

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        {/* Edit only for images */}
        {!isVideo && (
          <button
            type="button"
            onClick={() => onEdit(fileObj)}
            title="Crop/Rotate"
            className="bg-white bg-opacity-75 p-1 rounded hover:bg-opacity-100"
          >
            ✂️
          </button>
        )}

        {/* Replace */}
        <button
          type="button"
          onClick={handleReplaceClick}
          title="Replace"
          className="bg-white bg-opacity-75 p-1 rounded hover:bg-opacity-100"
        >
          🔄
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Delete */}
        <button
          type="button"
          onClick={() => {
            // clean up the blob URL when deleting
            if (displaySource && (editedFile instanceof Blob || file instanceof Blob)) {
              URL.revokeObjectURL(displaySource);
            }
            onDelete(fileObj.id);
          }}
          title="Delete"
          className="bg-white bg-opacity-75 p-1 rounded hover:bg-opacity-100"
        >
          🗑️
        </button>
      </div>

      {/* Edited badge */}
      {status === 'edited' && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
          Edited
        </div>
      )}

      {/* Caption field (commented out) */}
      {/*
      <input
        type="text"
        value={fileObj.caption}
        onChange={(e) => onCaptionChange(fileObj.id, e.target.value)}
        placeholder="Add caption…"
        className="absolute bottom-0 left-0 w-full p-1 border-t bg-white text-sm focus:outline-none"
      />
      */}
    </div>
  );
}
