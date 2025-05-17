export default function getCroppedImg(imageSrc, pixelCrop, fileType = 'image/jpeg') {
    const canvas = document.createElement('canvas');
    const image = new Image();

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const FIXED_WIDTH = 400; // ✅ Backend and frontend sync
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            const targetWidth = FIXED_WIDTH;
            const targetHeight = (pixelCrop.height / pixelCrop.width) * targetWidth;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                image,
                pixelCrop.x * scaleX,
                pixelCrop.y * scaleY,
                pixelCrop.width * scaleX,
                pixelCrop.height * scaleY,
                0,
                0,
                targetWidth,
                targetHeight
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, fileType || 'image/jpeg');
        };

        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = imageSrc;
    });
}
