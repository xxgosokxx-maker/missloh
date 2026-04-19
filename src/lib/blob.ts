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

// Defense-in-depth: any stored `audioUrl` coming from a client must point at
// Vercel Blob storage, not an attacker-controlled host. If BLOB_PUBLIC_BASE_URL
// is set, lock strictly to that origin; otherwise accept any Vercel Blob host.
const BLOB_HOST_RE =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//;

export function isOwnBlobUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const override = process.env.BLOB_PUBLIC_BASE_URL;
  if (override) return url.startsWith(override);
  return BLOB_HOST_RE.test(url);
}
