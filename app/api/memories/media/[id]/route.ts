import { memoriesAccountAccess } from "@/lib/memories/auth";
import { MEMORIES_BUCKET, MEMORIES_FEATURE_BUCKET, MEMORIES_FEATURE_PATH, memoriesClient } from "@/lib/memories/server";

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await memoriesAccountAccess()) return new Response(null, { status: 403, headers: privateHeaders });
  const { id } = await params;
  const client = memoriesClient();
  let bucket = MEMORIES_BUCKET;
  let path;
  if (id === "featured-video") { bucket = MEMORIES_FEATURE_BUCKET; path = MEMORIES_FEATURE_PATH; }
  else if (id === "featured-photo") path = "featured/friends-2026-10-12.jpeg";
  else {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404, headers: privateHeaders });
    const { data, error } = await client.from("memories_uploads").select("path").eq("id", id).eq("status", "complete").maybeSingle();
    if (error || !data) return new Response(null, { status: 404, headers: privateHeaders });
    path = data.path;
  }
  try {
    const { data: config, error: bucketError } = await client.storage.getBucket(bucket);
    if (bucketError || !config || config.public) return new Response(null, { status: 503, headers: privateHeaders });
    const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data) return new Response(null, { status: 503, headers: privateHeaders });
    const range = request.headers.get("range");
    if (range && !/^bytes=\d*-\d*$/.test(range)) return new Response(null, { status: 416, headers: privateHeaders });
    // Storage links stay on the server; opening this URL always requires a current account.
    const media = await fetch(data.signedUrl, { headers: range ? { Range: range } : {}, cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (!media.ok) return new Response(null, { status: media.status === 416 ? 416 : 503, headers: privateHeaders });
    const headers = new Headers(privateHeaders);
    for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const value = media.headers.get(key); if (value) headers.set(key, value);
    }
    return new Response(media.body, { status: media.status, headers });
  } catch {
    return new Response(null, { status: 503, headers: privateHeaders });
  }
}
