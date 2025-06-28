// src/utils/cropImageUtils.js

export default function getCroppedImg(imageSrc, pixelCrop, fileType = 'image/jpeg') {
  return new Promise(async (resolve, reject) => {
    // 1) Prepare canvas + image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = 'anonymous';

    let objectUrl; // if we create a blob: URL, track it so we can revoke

    // 2) If it's not already a blob: URL, fetch it as a Blob
    try {
      if (!imageSrc.startsWith('blob:')) {
        const response = await fetch(imageSrc, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        image.src = objectUrl;
      } else {
        image.src = imageSrc;
      }
    } catch (err) {
      return reject(err);
    }

    // 3) Draw & crop once loaded
    image.onload = () => {
      try {
        const FIXED_WIDTH = 400;  // ✅ must match your backend
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const targetWidth = FIXED_WIDTH;
        const targetHeight = (pixelCrop.height / pixelCrop.width) * targetWidth;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(
          image,
          pixelCrop.x * scaleX,
          pixelCrop.y * scaleY,
          pixelCrop.width * scaleX,
          pixelCrop.height * scaleY,
          0, 0,
          targetWidth,
          targetHeight
        );

        // 4) Export to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Canvas is empty'));
          }
          // clean up
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(blob);
        }, fileType);

      } catch (err) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    image.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
  });
}
