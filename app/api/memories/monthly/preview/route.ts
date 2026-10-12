import { memoriesAccountAccess } from "@/lib/memories/auth";
import { monthlySelection } from "@/lib/memories/monthly-server";
import { monthPeriod, monthlyMail } from "@/lib/memories/monthly";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET() {
  const account = await memoriesAccountAccess();
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" };
  if (!account || account.role !== "owner") return new Response("Alleen Bas kan het mailvoorbeeld bekijken.", { status: 403, headers });
  try {
    const period = monthPeriod();
    const photos = await monthlySelection(period);
    if (!photos.length) return new Response("Nog geen geschikte foto's uit deze maand in eerdere jaren. Vul jaar en maand aan in het archief.", { headers });
    return new Response(monthlyMail(period.month, photos, "https://www.basarens.com/herinneringen", true).html, { headers });
  } catch { return new Response("Het voorbeeld kon niet worden geladen.", { status: 503, headers }); }
}
