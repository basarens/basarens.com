import { createHash } from "node:crypto";
import { memoriesAuthClient, memoriesSameOrigin } from "@/lib/memories/auth";
import { memoriesClient, memoriesConfigured } from "@/lib/memories/server";

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!memoriesSameOrigin(request)) return reply({ error: "Open de inlogpagina opnieuw." }, 403);
  if (!memoriesConfigured()) return reply({ error: "Inloggen is nog niet beschikbaar." }, 503);
  const raw = await request.text();
  if (raw.length > 2048) return reply({ error: "Ongeldig verzoek." }, 400);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({ error: "Ongeldig verzoek." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "Ongeldig verzoek." }, 400);
  try {
    const auth = await memoriesAuthClient();
    if (body.action === "logout") {
      const { error: logoutError } = await auth.auth.signOut({ scope: "local" });
      if (logoutError) return reply({ error: "Uitloggen is niet gelukt. Probeer het opnieuw." }, 503);
      return reply({ signedOut: true });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !["send", "verify"].includes(body.action)) return reply({ error: "Vul een geldig e-mailadres in." }, 400);
    if (body.action === "verify" && (typeof body.code !== "string" || !/^\d{6,10}$/.test(body.code))) return reply({ error: "Vul de code uit je e-mail in." }, 400);
    const client = memoriesClient();
    const hash = createHash("sha256").update(`${process.env.MEMORIES_SUPABASE_SECRET_KEY}:${email}`).digest("hex");
    const limit = await client.rpc("memories_login_allowed", { limit_key: `${body.action}:${hash}`, max_attempts: body.action === "send" ? 5 : 15 });
    if (limit.error || !limit.data) return reply({ error: "Te veel pogingen. Probeer het later opnieuw." }, 429);
    const { data: member, error } = await client.from("memories_members").select("user_id").eq("email", email).eq("active", true).maybeSingle();
    if (error) return reply({ error: "Inloggen is tijdelijk niet beschikbaar." }, 503);
    if (body.action === "send") {
      if (member) {
        const { error: sendError } = await auth.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (sendError) return reply({ error: "De inlogmail kon nog niet worden verstuurd. Probeer het later opnieuw." }, 503);
      }
      return reply({ sent: true, message: "Als dit e-mailadres toegang heeft, ontvang je een inlogcode. Kijk ook bij ongewenste mail." });
    }
    if (!member) return reply({ error: "De code is ongeldig of verlopen." }, 403);
    const verified = await auth.auth.verifyOtp({ email, token: body.code, type: "email" });
    if (verified.error || !verified.data.user || verified.data.user.id !== member.user_id) {
      await auth.auth.signOut({ scope: "local" });
      return reply({ error: "De code is ongeldig of verlopen." }, 403);
    }
    const current = await client.from("memories_members").select("user_id").eq("user_id", verified.data.user.id).eq("active", true).maybeSingle();
    if (current.error || !current.data) { await auth.auth.signOut({ scope: "local" }); return reply({ error: "Dit account heeft geen toegang." }, 403); }
    return reply({ signedIn: true });
  } catch {
    return reply({ error: "Inloggen is tijdelijk niet beschikbaar." }, 503);
  }
}
