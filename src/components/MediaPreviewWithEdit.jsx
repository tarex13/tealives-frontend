import React from 'react';

const FIXED_WIDTH = 400;

function MediaPreviewWithEdit({ files, onEdit, onDelete }) {
    return (
        <div className="flex flex-wrap gap-4">
            {files.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="relative">
                    <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: `${FIXED_WIDTH}px`, objectFit: 'cover' }}
                        className="rounded shadow"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button
                            onClick={() => onEdit(file, idx)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(idx)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MediaPreviewWithEdit;
