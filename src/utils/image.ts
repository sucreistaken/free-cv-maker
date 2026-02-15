const MAX_RAW_SIZE = 5 * 1024 * 1024; // 5MB
const TARGET_SIZE = 200;
const JPEG_QUALITY = 0.85;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file.';
  }
  if (file.size > MAX_RAW_SIZE) {
    return 'Image is too large. Maximum size is 5MB.';
  }
  return null;
}

export function resizeImage(file: File, maxWidth = TARGET_SIZE, maxHeight = TARGET_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}
