import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function financeConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export async function createFinanceClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              }),
            );
          } catch {
            // A Server Component cannot write refreshed cookies; proxy.ts can.
          }
        },
      },
    },
  );
}

export async function getFinanceAccess() {
  if (!financeConfigured()) return null;
  const client = await createFinanceClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const { data: member, error: memberError } = await client
    .from("finance_members")
    .select("user_id")
    .eq("user_id", data.claims.sub)
    .maybeSingle();
  if (memberError || !member) return null;
  return { client, userId: data.claims.sub };
}
