import { memoriesAccountAccess, memoriesSameOrigin } from "@/lib/memories/auth";
import { memoriesClient } from "@/lib/memories/server";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in." }, 401);
  const result = await memoriesClient().from("memories_mail_preferences").select("enabled").eq("user_id", account.userId).maybeSingle();
  if (result.error) return reply({ error: "De mailinstelling kon niet worden geladen." }, 503);
  return reply({ enabled: result.data?.enabled ?? false, owner: account.role === "owner", ready: Boolean(process.env.MEMORIES_RESEND_API_KEY && process.env.CRON_SECRET) });
}
export async function POST(request: Request) {
  if (!memoriesSameOrigin(request)) return reply({ error: "Ongeldig verzoek." }, 403);
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in." }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 512) return reply({ error: "Ongeldig verzoek." }, 400);
    const body = JSON.parse(raw);
    if (!body || typeof body.enabled !== "boolean") return reply({ error: "Ongeldig verzoek." }, 400);
    const result = await memoriesClient().from("memories_mail_preferences").upsert({ user_id: account.userId, enabled: body.enabled, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (result.error) return reply({ error: "Opslaan is niet gelukt." }, 503);
    return reply({ enabled: body.enabled });
  } catch { return reply({ error: "Opslaan is niet gelukt." }, 400); }
}
