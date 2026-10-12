import { createHash, randomUUID } from "node:crypto";
import { archiveSearchFilter, MAX_PHOTO_BYTES, PHOTO_TYPES, readPhotoDate, validPhoto } from "@/lib/memories/files";
import { MEMORIES_BUCKET, memoriesClient, memoriesConfigured, memoriesLinkHash } from "@/lib/memories/server";

import { memoriesAccountAccess, memoriesSameOrigin } from "@/lib/memories/auth";

export const runtime = "nodejs";

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in met je eigen account." }, 401);
  if (!memoriesConfigured()) return reply({ error: "Het fotoarchief is nog niet beschikbaar." }, 503);
  const offsetText = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^\d{1,8}$/.test(offsetText)) return reply({ error: "Ongeldige archiefpagina." }, 400);
  const offset = Number(offsetText);
  const search = (new URL(request.url).searchParams.get("search") ?? "").trim();
  if (search.length > 100) return reply({ error: "Gebruik maximaal 100 tekens om te zoeken." }, 400);
  const sort = new URL(request.url).searchParams.get("sort") ?? "latest";
  const seed = new URL(request.url).searchParams.get("seed") ?? "";
  if (!["latest", "date", "shuffle"].includes(sort) || (sort === "shuffle" && !/^[a-zA-Z0-9-]{8,80}$/.test(seed))) return reply({ error: "Ongeldige sortering." }, 400);
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
    let result;
    if (sort === "shuffle") {
      // Shuffle metadata across the whole archive, while signing only the displayed page.
      // A stable seed keeps the same order when visitors load the next page.
      const all = [];
      for (let start = 0; ; start += 1000) {
        const batch = await query.order("id", { ascending: true }).range(start, start + 999);
        if (batch.error || !batch.data) return reply({ error: "Het archief kon niet worden geladen. Probeer opnieuw." }, 503);
        all.push(...batch.data);
        if (batch.data.length < 1000) break;
      }
      const shuffled = all.map((photo) => ({ photo, key: createHash("sha256").update(`${seed}:${photo.id}`).digest("hex") }))
        .sort((a, b) => a.key.localeCompare(b.key) || a.photo.id.localeCompare(b.photo.id));
      result = { data: shuffled.slice(offset, offset + 24).map((item) => item.photo), count: all.length, error: null };
    } else {
      if (sort === "date") query = query.order("photo_year", { ascending: false, nullsFirst: false })
        .order("photo_month", { ascending: false, nullsFirst: false }).order("photo_day", { ascending: false, nullsFirst: false });
      result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 23);
    }
    const { data: rows, count, error } = result;
    if (error || !rows) return reply({ error: "Het archief kon niet worden geladen. Probeer opnieuw." }, 503);
    const photos = rows.map(({ id, filename, name, message, photo_year, photo_month, photo_day, created_at }) => ({ id, filename, name, message, photo_year, photo_month, photo_day, created_at, url: `/api/memories/media/${id}` }));
    return reply({ photos, total: count ?? photos.length, nextOffset: offset + rows.length < (count ?? 0) ? offset + rows.length : null });
  } catch {
    return reply({ error: "Het archief is tijdelijk niet beschikbaar. Probeer opnieuw." }, 503);
  }
}

export async function PATCH(request: Request) {
  if (!memoriesSameOrigin(request)) return reply({ error: "Ongeldig verzoek." }, 403);
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in met je eigen account." }, 401);
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
      .update({ name: body.name.trim(), message: body.message.trim(), edited_by: account.userId, ...(editsDate ? date : {}) })
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
  if (!memoriesSameOrigin(request)) return reply({ error: "Ongeldig verzoek." }, 403);
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in met je eigen account." }, 401);
  if (!memoriesConfigured()) return reply({ error: "Het insturen staat nog niet aan. Probeer het later opnieuw." }, 503);
  // Only small metadata passes through Next.js; photos go directly to private storage.
  const raw = await request.text();
  if (raw.length > 8192) return reply({ error: "De beschrijving is te lang." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({ error: "Ongeldig verzoek." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "Ongeldig verzoek." }, 400);
  const client = memoriesClient();
  const linkHash = memoriesLinkHash("memories-accounts");

  try {
    if (body.action === "complete") {
      if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/.test(body.id)) return reply({ error: "Ongeldige foto." }, 400);
      const { data: photo, error } = await client.from("memories_uploads").select("path,size,status").eq("id", body.id).eq("uploaded_by", account.userId).maybeSingle();
      if (error || !photo) return reply({ error: "Deze foto kon niet worden gevonden." }, 404);
      const { data: info, error: infoError } = await client.storage.from(MEMORIES_BUCKET).info(photo.path);
      if (infoError || !info) return reply({ error: "De foto is nog niet ontvangen. Probeer opnieuw." }, 409);
      if (typeof info.size !== "number" || info.size !== photo.size || info.size > MAX_PHOTO_BYTES) {
        await client.storage.from(MEMORIES_BUCKET).remove([photo.path]);
        return reply({ error: "De ontvangen foto heeft een ongeldige bestandsgrootte." }, 400);
      }
      const { error: updateError } = await client.from("memories_uploads").update({ status: "complete" }).eq("id", body.id).eq("uploaded_by", account.userId);
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
      id, path, link_hash: linkHash, uploaded_by: account.userId, filename: body.filename.trim(), size: body.size,
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
