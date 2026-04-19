export async function compressImageToWebp(
  file: Blob,
  maxDim = 1024,
  quality = 0.8
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    1,
    maxDim / Math.max(bitmap.width, bitmap.height)
  );
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/webp",
      quality
    );
  });
}
