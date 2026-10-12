import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const MEMORIES_BUCKET = "memories-inbox";
export const MEMORIES_FEATURE_BUCKET = "memories-featured";
export const MEMORIES_FEATURE_PATH = "bas-video-2026-10-12.mp4";

export async function memoriesFeaturedVideoUrl() {
  if (!memoriesConfigured()) return undefined;
  const client = memoriesClient();
  const { data: bucket, error: bucketError } = await client.storage.getBucket(MEMORIES_FEATURE_BUCKET);
  if (bucketError || !bucket || bucket.public) return undefined;
  const { data, error } = await client.storage.from(MEMORIES_FEATURE_BUCKET).createSignedUrl(MEMORIES_FEATURE_PATH, 3600);
  return error ? undefined : data?.signedUrl;
}

export async function memoriesFeaturedPhotoUrl() {
  if (!memoriesConfigured()) return undefined;
  const client = memoriesClient();
  const { data: bucket, error: bucketError } = await client.storage.getBucket(MEMORIES_BUCKET);
  if (bucketError || !bucket || bucket.public) return undefined;
  const { data, error } = await client.storage.from(MEMORIES_BUCKET).createSignedUrl("featured/friends-2026-10-12.jpeg", 3600);
  return error ? undefined : data?.signedUrl;
}

export function validMemoriesToken(token: string) {
  const expected = process.env.MEMORIES_UPLOAD_TOKEN;
  if (!expected || expected.length < 32 || token.length > 200) return false;
  return timingSafeEqual(
    createHash("sha256").update(token).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export function memoriesConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.MEMORIES_SUPABASE_SECRET_KEY);
}

export function memoriesClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.MEMORIES_SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function memoriesLinkHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
