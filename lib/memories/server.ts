import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const MEMORIES_BUCKET = "memories-inbox";
export const MEMORIES_FEATURE_BUCKET = "memories-featured";
export const MEMORIES_FEATURE_PATH = "bas-video-2026-10-12.mp4";

export function memoriesConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.MEMORIES_SUPABASE_SECRET_KEY);
}

export function memoriesClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.MEMORIES_SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function memoriesLinkHash(group: string) {
  return createHash("sha256").update(group).digest("hex");
}
