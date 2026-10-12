import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/herinneringen") || request.nextUrl.pathname.startsWith("/api/memories")) {
    let response = NextResponse.next({ request });
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.MEMORIES_SUPABASE_SECRET_KEY) {
      const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.MEMORIES_SUPABASE_SECRET_KEY, {
        cookieOptions: { name: "basarens-memories-auth" },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(items) {
            for (const { name, value } of items) request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of items) response.cookies.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
          },
        },
      });
      try { await auth.auth.getClaims(); } catch { /* Pages and APIs deny invalid sessions. */ }
    }
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            }),
          );
        },
      },
    },
  );
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/finance/:path*", "/herinneringen/:path*", "/api/memories/:path*"] };
