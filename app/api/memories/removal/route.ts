import { memoriesAccountAccess, memoriesSameOrigin } from "@/lib/memories/auth";
import { memoriesClient } from "@/lib/memories/server";

export async function POST(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!memoriesSameOrigin(request)) return reply({ error: "Ongeldig verzoek." }, 403);
  const account = await memoriesAccountAccess();
  if (!account) return reply({ error: "Log eerst in." }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: "Ongeldig verzoek." }, 400);
    const body = JSON.parse(raw);
    if (!body || typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) || !["vote", "withdraw", "restore"].includes(body.action)) return reply({ error: "Ongeldig verzoek." }, 400);
    if (body.action === "restore" && account.role !== "owner") return reply({ error: "Alleen Bas kan foto's terugzetten." }, 403);
    const { data, error } = await memoriesClient().rpc("memories_removal_action", { photo: body.id, voter: account.userId, operation: body.action });
    if (error || !data) return reply({ error: "De foto is niet meer beschikbaar of de wijziging is niet gelukt. Vernieuw het archief." }, 409);
    return reply(data);
  } catch { return reply({ error: "De wijziging is niet gelukt. Probeer opnieuw." }, 400); }
}
