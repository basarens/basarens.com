import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const MEMORIES_BUCKET = "memories-inbox";

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
