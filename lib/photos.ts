// Utilidades de fotos para el navegador (registro de conductores).
// Las fotos se comprimen aquí y se suben directo a Supabase Storage con una URL firmada,
// así no pasan por Vercel (que rechaza peticiones de más de 4,5 MB).

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // Igual al límite del bucket "fotos"
export const PHOTO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

/**
 * Reduce la foto a máximo `maxSide` px por lado en JPEG. Una foto de celular de 4–8 MB queda en 200–400 KB.
 * Si el navegador no puede leerla, devuelve el archivo original (el servidor y el bucket lo validan igual).
 */
export async function compressPhoto(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file); // Respeta la orientación EXIF en navegadores actuales
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size > 0) return blob;
  } catch {
    // Formato que el navegador no decodifica: se intenta con el original
  }
  return file;
}

export const isUploadable = (b: Blob) => b.type in PHOTO_EXT && b.size > 0 && b.size <= MAX_PHOTO_BYTES;

/** Sube una foto a la URL firmada que entregó el servidor. */
export async function uploadPhoto(signedUrl: string, photo: Blob): Promise<void> {
  const res = await fetch(signedUrl, { method: "PUT", headers: { "content-type": photo.type }, body: photo });
  if (!res.ok) throw new Error(`upload ${res.status}`);
}
