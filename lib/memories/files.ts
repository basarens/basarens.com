export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export function archiveSearchFilter(search: string) {
  const pattern = `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
  const value = JSON.stringify(pattern);
  return `name.ilike.${value},message.ilike.${value}`;
}
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function photoType(name: string, type: string) {
  if (PHOTO_TYPES[type]) return type;
  if (type) return null;
  const extension = name.split(".").pop()?.toLowerCase();
  return Object.entries(PHOTO_TYPES).find(([, ext]) => ext === extension)?.[0] ??
    (extension === "jpeg" ? "image/jpeg" : null);
}

export function validPhoto(size: number, type: string) {
  return Number.isSafeInteger(size) && size > 0 && size <= MAX_PHOTO_BYTES && Boolean(PHOTO_TYPES[type]);
}
