export async function compressImageToWebp(
  file: Blob,
  maxDim = 1024,
  quality = 0.8
): Promise<Blob> {
  const source = await decodeImage(file);
  const ratio = Math.min(1, maxDim / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * ratio));
  const h = Math.max(1, Math.round(source.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.drawImage(source.image, 0, 0, w, h);
  if ("close" in source.image) source.image.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/webp",
      quality
    );
  });
}

type DecodedImage = {
  image: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
};

async function decodeImage(file: Blob): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    return { image: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    return await decodeViaImgElement(file);
  }
}

function decodeViaImgElement(file: Blob): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        URL.revokeObjectURL(url);
        reject(new Error(describeDecodeError(file)));
        return;
      }
      resolve({ image: img, width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(describeDecodeError(file)));
    };
    img.src = url;
  });
}

function describeDecodeError(file: Blob): string {
  const name = file instanceof File ? file.name : "image";
  const ext = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (ext === "heic" || ext === "heif") {
    return `"${name}" is a HEIC/HEIF image, which browsers can't decode. On iPhone, change Settings → Camera → Formats to "Most Compatible", or convert the file to JPG/PNG first.`;
  }
  return `Couldn't decode "${name}". Try a PNG, JPG, or WebP instead.`;
}
