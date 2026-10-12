import { randomUUID } from "node:crypto";
import { archiveSearchFilter, MAX_PHOTO_BYTES, PHOTO_TYPES, readPhotoDate, validPhoto } from "@/lib/memories/files";
import { MEMORIES_BUCKET, memoriesClient, memoriesConfigured, memoriesLinkHash, validMemoriesToken } from "@/lib/memories/server";

export const runtime = "nodejs";

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!validMemoriesToken(token)) return reply({ error: "Deze uitnodigingslink is niet geldig." }, 403);
  if (!memoriesConfigured()) return reply({ error: "Het fotoarchief is nog niet beschikbaar." }, 503);
  const offsetText = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^\d{1,8}$/.test(offsetText)) return reply({ error: "Ongeldige archiefpagina." }, 400);
  const offset = Number(offsetText);
  const search = (new URL(request.url).searchParams.get("search") ?? "").trim();
  if (search.length > 100) return reply({ error: "Gebruik maximaal 100 tekens om te zoeken." }, 400);
  try {
    const client = memoriesClient();
    const { data: bucket, error: bucketError } = await client.storage.getBucket(MEMORIES_BUCKET);
    if (bucketError || !bucket || bucket.public) return reply({ error: "Het fotoarchief is tijdelijk niet beschikbaar." }, 503);
    // The current invitation grants access to the entire completed archive,
    // including photos sent through previous invitations. Never show pending uploads.
    let query = client.from("memories_uploads")
      .select("id,path,filename,name,message,photo_year,photo_month,photo_day,created_at", { count: "exact" })
      .eq("status", "complete");
    if (search) query = query.or(archiveSearchFilter(search));
    const { data: rows, count, error } = await query.order("created_at", { ascending: false })
      .order("id", { ascending: false }).range(offset, offset + 23);
    if (error || !rows) return reply({ error: "Het archief kon niet worden geladen. Probeer opnieuw." }, 503);
    const { data: signed, error: signingError } = rows.length
      ? await client.storage.from(MEMORIES_BUCKET).createSignedUrls(rows.map((row) => row.path), 3600)
      : { data: [], error: null };
    if (signingError || !signed) return reply({ error: "De foto’s konden niet worden geladen. Probeer opnieuw." }, 503);
    const photos = rows.map(({ path, ...photo }) => ({
      ...photo, url: signed.find((item) => item.path === path && !item.error)?.signedUrl ?? null,
    }));
    return reply({ photos, total: count ?? photos.length, nextOffset: offset + rows.length < (count ?? 0) ? offset + rows.length : null });
  } catch {
    return reply({ error: "Het archief is tijdelijk niet beschikbaar. Probeer opnieuw." }, 503);
  }
}

export async function PATCH(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!validMemoriesToken(token)) return reply({ error: "Deze uitnodigingslink is niet geldig." }, 403);
  if (!memoriesConfigured()) return reply({ error: "Het archief is nog niet beschikbaar." }, 503);
  const raw = await request.text();
  if (raw.length > 8192) return reply({ error: "De context is te lang." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({ error: "Ongeldig verzoek." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) ||
      typeof body.name !== "string" || body.name.length > 80 ||
      typeof body.message !== "string" || body.message.length > 1200 ||
      typeof body.previousName !== "string" || body.previousName.length > 80 ||
      typeof body.previousMessage !== "string" || body.previousMessage.length > 1200) {
    return reply({ error: "Gebruik maximaal 80 tekens voor de fotograaf en 1.200 voor de context." }, 400);
  }
  const editsDate = ["photo_year", "photo_month", "photo_day"].some((field) => Object.hasOwn(body, field));
  const date = readPhotoDate(body);
  const previousDate = body.previousDate && typeof body.previousDate === "object" && !Array.isArray(body.previousDate) ? readPhotoDate(body.previousDate) : null;
  if (!date || (editsDate && !previousDate)) return reply({ error: "Vul een geldig jaar in, eventueel met maand en dag. Controleer of de datum bestaat." }, 400);
  try {
    const client = memoriesClient();
    // Compare-and-update in one query: another visitor's edit must not be overwritten.
    let update = client.from("memories_uploads")
      .update({ name: body.name.trim(), message: body.message.trim(), ...(editsDate ? date : {}) })
      .eq("id", body.id).eq("status", "complete")
      .eq("name", body.previousName).eq("message", body.previousMessage);
    if (editsDate && previousDate) {
      for (const [field, value] of Object.entries(previousDate)) update = value === null ? update.is(field, null) : update.eq(field, value);
    }
    const { data, error } = await update.select("id,name,message,photo_year,photo_month,photo_day").maybeSingle();
    if (error) return reply({ error: "Opslaan is niet gelukt. Probeer opnieuw." }, 503);
    if (!data) {
      const { data: current, error: currentError } = await client.from("memories_uploads")
        .select("id,name,message,photo_year,photo_month,photo_day").eq("id", body.id).eq("status", "complete").maybeSingle();
      if (currentError) return reply({ error: "Opslaan is niet gelukt. Probeer opnieuw." }, 503);
      if (!current) return reply({ error: "Deze foto is niet beschikbaar." }, 404);
      return reply({ error: "Iemand heeft deze foto ondertussen aangepast. Bekijk eerst de nieuwste context.", current }, 409);
    }
    return reply({ photo: data });
  } catch {
    return reply({ error: "Opslaan is tijdelijk niet beschikbaar. Probeer opnieuw." }, 503);
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!validMemoriesToken(token)) return reply({ error: "Deze uitnodigingslink is niet geldig." }, 403);
  if (!memoriesConfigured()) return reply({ error: "Het insturen staat nog niet aan. Probeer het later opnieuw." }, 503);
  // Only small metadata passes through Next.js; photos go directly to private storage.
  const raw = await request.text();
  if (raw.length > 8192) return reply({ error: "De beschrijving is te lang." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({ error: "Ongeldig verzoek." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "Ongeldig verzoek." }, 400);
  const client = memoriesClient();
  const linkHash = memoriesLinkHash(token);

  try {
    if (body.action === "complete") {
      if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/.test(body.id)) return reply({ error: "Ongeldige foto." }, 400);
      const { data: photo, error } = await client.from("memories_uploads").select("path,size,status").eq("id", body.id).eq("link_hash", linkHash).maybeSingle();
      if (error || !photo) return reply({ error: "Deze foto kon niet worden gevonden." }, 404);
      const { data: info, error: infoError } = await client.storage.from(MEMORIES_BUCKET).info(photo.path);
      if (infoError || !info) return reply({ error: "De foto is nog niet ontvangen. Probeer opnieuw." }, 409);
      if (typeof info.size !== "number" || info.size !== photo.size || info.size > MAX_PHOTO_BYTES) {
        await client.storage.from(MEMORIES_BUCKET).remove([photo.path]);
        return reply({ error: "De ontvangen foto heeft een ongeldige bestandsgrootte." }, 400);
      }
      const { error: updateError } = await client.from("memories_uploads").update({ status: "complete" }).eq("id", body.id).eq("link_hash", linkHash);
      if (updateError) return reply({ error: "De ontvangst kon niet bevestigd worden. Probeer opnieuw." }, 503);
      return reply({ received: true });
    }

    if (body.action !== "prepare" || typeof body.filename !== "string" || body.filename.length > 255 || !body.filename.trim() ||
        typeof body.type !== "string" || !validPhoto(body.size, body.type) ||
        typeof body.name !== "string" || body.name.length > 80 || typeof body.message !== "string" || body.message.length > 1200) {
      return reply({ error: "Kies een JPG, PNG, WEBP of HEIC-foto van maximaal 20 MB." }, 400);
    }
    const date = readPhotoDate(body);
    if (!date) return reply({ error: "Vul een geldig jaar in, eventueel met maand en dag. Controleer of de datum bestaat." }, 400);
    const { data: bucket, error: bucketError } = await client.storage.getBucket(MEMORIES_BUCKET);
    if (bucketError || !bucket || bucket.public || !bucket.file_size_limit || Number(bucket.file_size_limit) > MAX_PHOTO_BYTES ||
        !bucket.allowed_mime_types?.length || bucket.allowed_mime_types.some((type) => !PHOTO_TYPES[type])) {
      return reply({ error: "De foto-opslag is nog niet klaar. Probeer het later opnieuw." }, 503);
    }
    const id = randomUUID();
    const path = `${linkHash.slice(0, 16)}/${id}.${PHOTO_TYPES[body.type]}`;
    const { error: reservationError } = await client.from("memories_uploads").insert({
      id, path, link_hash: linkHash, filename: body.filename.trim(), size: body.size,
      name: body.name.trim(), message: body.message.trim(), ...date, status: "pending",
    });
    if (reservationError) return reply({ error: "Het insturen is momenteel niet beschikbaar. Probeer het later opnieuw." }, 503);
    const { data, error } = await client.storage.from(MEMORIES_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      await client.from("memories_uploads").delete().eq("id", id);
      return reply({ error: "De upload kon niet starten. Probeer opnieuw." }, 503);
    }
    return reply({ id, uploadUrl: data.signedUrl });
  } catch {
    return reply({ error: "Het insturen is tijdelijk niet beschikbaar. Probeer opnieuw." }, 503);
  }
}
