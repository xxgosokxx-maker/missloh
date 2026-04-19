import { put } from "@vercel/blob";

export async function uploadBlob(
  pathname: string,
  body: Buffer | Blob | ArrayBuffer,
  contentType: string
): Promise<string> {
  const { url } = await put(pathname, body as Buffer | Blob, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return url;
}
