export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export type PhotoDate = { photo_year: number | null; photo_month: number | null; photo_day: number | null };
export const EMPTY_PHOTO_DATE: PhotoDate = { photo_year: null, photo_month: null, photo_day: null };
export const PHOTO_MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

export function readPhotoDate(value: Record<string, unknown>): PhotoDate | null {
  const year = value.photo_year ?? null;
  const month = value.photo_month ?? null;
  const day = value.photo_day ?? null;
  if (year !== null && (typeof year !== "number" || !Number.isInteger(year) || year < 1 || year > 9999)) return null;
  if (month !== null && (typeof month !== "number" || !Number.isInteger(month) || month < 1 || month > 12 || year === null)) return null;
  if (day !== null) {
    if (typeof day !== "number" || !Number.isInteger(day) || year === null || month === null) return null;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > days[month - 1]) return null;
  }
  return { photo_year: year, photo_month: month, photo_day: day } as PhotoDate;
}

export function formatPhotoDate(date: PhotoDate) {
  if (!date.photo_year) return "Datum nog onbekend";
  return [date.photo_day, date.photo_month ? PHOTO_MONTHS[date.photo_month - 1] : null, date.photo_year].filter((part) => part !== null).join(" ");
}
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
