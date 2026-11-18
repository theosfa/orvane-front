// Shrinks a photo in the browser before upload: phone pictures are 5–10 MB, this makes them
// ~0.3–0.8 MB, so uploads over mobile data are quick. The server re-encodes to WebP anyway.
// If the browser can't decode the file (e.g. HEIC on desktop Chrome) the original is sent as is.
const MAX_SIDE = 2000;

export async function prepareImage(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    // a small file that is already compressed can come out bigger — keep whichever is smaller
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
