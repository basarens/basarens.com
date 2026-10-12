import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { memoriesClient, memoriesConfigured } from "./server";

// Separate cookies prevent a memories sign-in from changing a Finance session.
export async function memoriesAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.MEMORIES_SUPABASE_SECRET_KEY!, {
    cookieOptions: { name: "basarens-memories-auth" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items) {
        try {
          for (const { name, value, options } of items) cookieStore.set(name, value, {
            ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
          });
        } catch {
          // Server Components cannot write cookies. A route or proxy refreshes them.
        }
      },
    },
  });
}

export async function memoriesAccountAccess() {
  if (!memoriesConfigured()) return null;
  try {
    const auth = await memoriesAuthClient();
    // Ask Auth to validate the current session; never authorize from cookie contents.
    const { data, error } = await auth.auth.getUser();
    if (error || !data.user) return null;
    const { data: member, error: memberError } = await memoriesClient().from("memories_members")
      .select("user_id,display_name,role").eq("user_id", data.user.id).eq("active", true).maybeSingle();
    // Check membership on every request so revoking a friend takes effect immediately.
    if (memberError || !member) return null;
    return { auth, userId: data.user.id, displayName: member.display_name, role: member.role as "owner" | "friend" };
  } catch {
    return null;
  }
}

export function memoriesSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (process.env.NODE_ENV === "production") return origin === "https://www.basarens.com";
  if (origin === new URL(request.url).origin) return true;
  // Next dev may expose localhost in Request.url while the browser uses 127.0.0.1.
  try { return new URL(origin).host === request.headers.get("host") && new URL(origin).protocol === "http:"; }
  catch { return false; }
}
