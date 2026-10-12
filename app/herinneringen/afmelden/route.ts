import { memoriesClient } from "@/lib/memories/server";
import { memoriesSameOrigin } from "@/lib/memories/auth";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" };
const validToken = (value: string | null) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
function page(content: string, status = 200) {
  return new Response(`<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Herinneringsmails · Bas Arens</title></head><body style="margin:0;background:#f3eee4;color:#29392e;font-family:Arial,sans-serif"><main style="max-width:480px;margin:12vh auto;padding:28px"><p>BAS ARENS · HERINNERINGEN</p>${content}<p><a style="color:inherit" href="/herinneringen">Naar het privéarchief</a></p></main></body></html>`, { status, headers });
}
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!validToken(token)) return page("<h1>Deze afmeldlink is ongeldig.</h1>", 400);
  // A GET never changes a preference: mail scanners must not unsubscribe friends.
  return page(`<h1>Geen herinneringsmails meer?</h1><p>Je account en toegang tot het archief blijven gewoon werken.</p><form method="post" action="/herinneringen/afmelden"><input type="hidden" name="token" value="${token}"><button style="padding:14px 20px;border:0;border-radius:8px;background:#29392e;color:#fffdf8;font:inherit;cursor:pointer" type="submit">Herinneringsmails uitzetten</button></form>`);
}
export async function POST(request: Request) {
  if (!memoriesSameOrigin(request)) return page("<h1>Open de afmeldlink opnieuw.</h1>", 403);
  try {
    const raw = await request.text();
    if (raw.length > 512) return page("<h1>Deze afmeldlink is ongeldig.</h1>", 400);
    const token = new URLSearchParams(raw).get("token");
    if (!validToken(token)) return page("<h1>Deze afmeldlink is ongeldig.</h1>", 400);
    const result = await memoriesClient().from("memories_mail_preferences").update({ enabled: false, updated_at: new Date().toISOString() }).eq("unsubscribe_token", token).select("user_id").maybeSingle();
    if (result.error) return page("<h1>Afmelden is niet gelukt.</h1><p>Probeer het opnieuw.</p>", 503);
    if (!result.data) return page("<h1>Deze afmeldlink is ongeldig.</h1>", 400);
    return page("<h1>De herinneringsmails staan uit.</h1><p>Je kunt ze later weer aanzetten in het privéarchief.</p>");
  } catch { return page("<h1>Afmelden is niet gelukt.</h1>", 503); }
}
