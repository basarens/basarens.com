import { validCronAuthorization } from "@/lib/memories/monthly";
import { sendMonthlyMemories } from "@/lib/memories/monthly-server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!validCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)) return reply({ error: "Unauthorized" }, 401);
  try { return reply(await sendMonthlyMemories()); }
  catch { return reply({ error: "Monthly mail unavailable" }, 503); }
}
