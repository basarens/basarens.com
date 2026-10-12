import { createHash, timingSafeEqual } from "node:crypto";
import { PHOTO_MONTHS, formatPhotoDate, type PhotoDate } from "./files";

export type MailPhoto = PhotoDate & { id: string; message: string; image: string };
export const ARCHIVE_URL = "https://www.basarens.com/herinneringen";

export function monthPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day"), period: `${part("year")}-${String(part("month")).padStart(2, "0")}` };
}
export function validCronAuthorization(header: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || !header) return false;
  const actual = Buffer.from(header), expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function sortMonthlyPhotos<T extends { id: string }>(photos: T[], period: string) {
  const rank = (id: string) => createHash("sha256").update(`${period}:${id}`).digest("hex");
  return [...photos].sort((a, b) => rank(a.id).localeCompare(rank(b.id)));
}
export function escapeMailText(value: string) { return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }
export function monthlyMail(month: number, photos: MailPhoto[], unsubscribeUrl: string, preview = false) {
  const monthName = PHOTO_MONTHS[month - 1];
  const subject = `Dit deden we in ${monthName} · ons fotoarchief`;
  const cards = photos.slice(0, 4).map((photo, index) => `<div style="margin:24px 0;background:#fffdf8;border-radius:12px;overflow:hidden"><img src="${preview ? `data:image/jpeg;base64,${photo.image}` : `cid:memory-${index}`}" alt="Foto uit ${escapeMailText(formatPhotoDate(photo))}" style="display:block;width:100%;max-height:480px;object-fit:contain;background:#e9e6de"/><div style="padding:18px"><p style="font-size:13px;color:#657166;margin:0 0 8px">${escapeMailText(formatPhotoDate(photo))}</p><p style="margin:0;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere">${escapeMailText(photo.message.trim().slice(0, 280) || "Wat gebeurde hier ook alweer? Vul het verhaal aan in het archief.")}</p></div></div>`).join("");
  const html = `<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeMailText(subject)}</title></head><body style="margin:0;background:#f3eee4;color:#29392e;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;padding:30px 20px"><p style="font-size:11px;letter-spacing:2px">BAS ARENS · HERINNERINGEN</p><h1 style="font-size:32px;line-height:1.2">Dit deden we in ${monthName}…</h1><p style="line-height:1.7">Een paar foto's uit dezelfde maand in eerdere jaren. Sommige plannen waren beter dan andere.</p>${cards}<p style="text-align:center;margin:30px 0"><a href="${ARCHIVE_URL}" style="display:inline-block;background:#29392e;color:#fffdf8;padding:15px 22px;border-radius:8px;text-decoration:none">Bekijk het privéarchief ↗</a></p><p style="font-size:12px;line-height:1.7;color:#657166">Maximaal één herinneringsmail per maand, alleen als er foto's zijn. Het volledige archief blijft achter jullie accounts.</p><p style="font-size:12px"><a style="color:#657166" href="${escapeMailText(unsubscribeUrl)}">Geen herinneringsmails meer ontvangen</a></p></div></body></html>`;
  const text = `${subject}\n\nEen paar foto's uit dezelfde maand in eerdere jaren.\n\n${photos.slice(0, 4).map((p) => `${formatPhotoDate(p)}\n${p.message.slice(0, 280) || "Context nog onbekend"}`).join("\n\n")}\n\nBekijk het privéarchief: ${ARCHIVE_URL}\n\nAfmelden: ${unsubscribeUrl}`;
  return { subject, html, text, attachments: photos.slice(0, 4).map((photo, index) => ({ filename: `herinnering-${index + 1}.jpg`, content: photo.image, content_type: "image/jpeg", content_id: `memory-${index}` })) };
}
