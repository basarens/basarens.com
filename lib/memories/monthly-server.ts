import "server-only";
import sharp from "sharp";
import { MEMORIES_BUCKET, memoriesClient } from "./server";
import { monthPeriod, monthlyMail, sortMonthlyPhotos, type MailPhoto } from "./monthly";

export async function monthlySelection(period = monthPeriod()) {
  const client = memoriesClient();
  const bucket = await client.storage.getBucket(MEMORIES_BUCKET);
  if (bucket.error || !bucket.data || bucket.data.public) throw new Error("Private storage unavailable");
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("memories_uploads").select("id,path,message,size,photo_year,photo_month,photo_day,memories_removal_votes(user_id)")
      .eq("status", "complete").is("deleted_at", null).eq("photo_month", period.month).lt("photo_year", period.year).order("id").range(offset, offset + 999);
    if (result.error) throw new Error("Selection unavailable");
    rows.push(...result.data);
    if (result.data.length < 1000) break;
  }
  // Don't highlight a disputed photo while friends are deciding whether to remove it.
  const candidates = sortMonthlyPhotos(rows.filter((row) => !row.memories_removal_votes?.length), period.period);
  const selected: MailPhoto[] = [];
  for (const photo of candidates.slice(0, 16)) {
    if (selected.length === 4) break;
    if (photo.size > 20 * 1024 * 1024) continue;
    const result = await client.storage.from(MEMORIES_BUCKET).download(photo.path);
    if (result.error || !result.data) continue;
    try {
      const buffer = Buffer.from(await result.data.arrayBuffer());
      if (buffer.length > 20 * 1024 * 1024) continue;
      const image = await sharp(buffer, { limitInputPixels: 40000000 }).rotate().resize({ width: 640, height: 480, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
      if (image.length > 200000) continue;
      selected.push({ id: photo.id, message: photo.message, photo_year: photo.photo_year, photo_month: photo.photo_month, photo_day: photo.photo_day, image: image.toString("base64") });
    } catch { /* Unsupported/damaged originals are skipped; never send unconverted files. */ }
  }
  return selected;
}

export async function sendMonthlyMemories() {
  const period = monthPeriod();
  if (period.day > 7) return { skipped: "outside-monthly-window" };
  if (!process.env.MEMORIES_RESEND_API_KEY) return { skipped: "mail-not-configured" };
  const client = memoriesClient();
  const preferences = await client.from("memories_mail_preferences").select("user_id,unsubscribe_token,memories_members(email,active)").eq("enabled", true);
  if (preferences.error) throw new Error("Preferences unavailable");
  // Recover conservatively after a crashed request: never automatically send an uncertain mail again.
  await client.from("memories_mail_deliveries").update({ state: "uncertain" }).eq("period", period.period).eq("state", "sending").lt("claimed_at", new Date(Date.now() - 3600000).toISOString());
  let photos: MailPhoto[] | null = null;
  let sent = 0;
  let failed = 0;
  for (const preference of preferences.data) {
    const member = preference.memories_members as unknown as { email: string; active: boolean } | null;
    if (!member?.active) continue;
    const existing = await client.from("memories_mail_deliveries").select("state").eq("period", period.period).eq("user_id", preference.user_id).maybeSingle();
    if (existing.error) throw new Error("Delivery unavailable");
    if (existing.data && !["pending", "failed"].includes(existing.data.state)) continue;
    if (!existing.data) {
      photos ??= await monthlySelection(period);
      if (!photos.length) return { skipped: "no-eligible-photos" };
      const unsubscribeUrl = `https://www.basarens.com/herinneringen/afmelden?token=${preference.unsubscribe_token}`;
      const mail = monthlyMail(period.month, photos, unsubscribeUrl);
      const inserted = await client.from("memories_mail_deliveries").upsert({ period: period.period, user_id: preference.user_id, photo_ids: photos.map((photo) => photo.id), payload: { from: "Bas Arens · herinneringen <herinneringen@basarens.com>", to: [member.email], ...mail, headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` } } }, { onConflict: "period,user_id", ignoreDuplicates: true });
      if (inserted.error) throw new Error("Delivery reservation failed");
    }
    const claim = await client.rpc("memories_claim_mail", { mail_period: period.period, recipient: preference.user_id });
    if (claim.error) throw new Error("Delivery claim failed");
    if (!claim.data) continue;
    const delivery = await client.from("memories_mail_deliveries").select("payload,photo_ids").eq("period", period.period).eq("user_id", preference.user_id).single();
    if (delivery.error || !delivery.data.payload) throw new Error("Reserved delivery unavailable");
    const current = await client.from("memories_uploads").select("id,memories_removal_votes(user_id)").in("id", delivery.data.photo_ids).eq("status", "complete").is("deleted_at", null);
    const allowed = await client.from("memories_mail_preferences").select("enabled,memories_members(active)").eq("user_id", preference.user_id).single();
    const activeMember = allowed.data?.memories_members as unknown as { active: boolean } | null;
    if (current.error || allowed.error) throw new Error("Delivery recheck unavailable");
    if (!allowed.data.enabled || !activeMember?.active || current.data.length !== delivery.data.photo_ids.length || current.data.some((row) => row.memories_removal_votes?.length)) {
      await client.from("memories_mail_deliveries").update({ state: "skipped", payload: null }).eq("period", period.period).eq("user_id", preference.user_id);
      continue;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.MEMORIES_RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `memories-${period.period}-${preference.user_id}` }, body: JSON.stringify(delivery.data.payload), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || typeof result.id !== "string") {
        // Only rate-limit/validation failures are certainly not accepted by the provider.
        const state = response.status >= 400 && response.status < 500 ? "failed" : "uncertain";
        await client.from("memories_mail_deliveries").update({ state }).eq("period", period.period).eq("user_id", preference.user_id);
        failed++; continue;
      }
      const saved = await client.from("memories_mail_deliveries").update({ state: "sent", provider_id: result.id, sent_at: new Date().toISOString(), payload: null }).eq("period", period.period).eq("user_id", preference.user_id);
      if (saved.error) throw new Error("Delivery receipt unavailable");
      sent++;
    } catch {
      await client.from("memories_mail_deliveries").update({ state: "uncertain" }).eq("period", period.period).eq("user_id", preference.user_id);
      failed++;
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return { sent, failed };
}
