import { NextRequest, NextResponse } from "next/server";

const AUTH_URL  = (process.env.NEXT_PUBLIC_AUTH_URL  ?? "https://auth.yesp.space").replace(/\/$/, "");
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.yesp.space").replace(/\/$/, "");

function corsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (origin) {
    try {
      const url = new URL(origin);
      res.headers.set("Access-Control-Allow-Origin", url.origin);
    } catch {
      res.headers.set("Access-Control-Allow-Origin", "*");
    }
  } else {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  return res;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return corsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  const { pathname } = request.nextUrl;

  const allowed =
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin-pin") ||
    pathname.startsWith("/bridge") ||
    pathname.startsWith("/api");

  if (!allowed) {
    const loginUrl = `${AUTH_URL}/auth/login?next=${encodeURIComponent(ADMIN_URL + "/admin")}`;
    return corsHeaders(request, NextResponse.redirect(loginUrl));
  }

  // PIN gate — all /admin paths require the pin cookie.
  // /admin-pin, /bridge, /api are exempt so the user can reach the PIN page
  // and complete the auth handoff without being redirected.
  if (pathname.startsWith("/admin")) {
    const pin = request.cookies.get("yesp_admin_pin");
    if (pin?.value !== "ok") {
      const pinUrl = new URL("/admin-pin", request.url);
      // Only allow /admin paths as the next destination to prevent open redirect
      const dest = pathname.startsWith("/admin") ? pathname : "/admin";
      pinUrl.searchParams.set("next", dest);
      return corsHeaders(request, NextResponse.redirect(pinUrl));
    }
  }

  return corsHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|og-image\\.png|manifest\\.json).*)"],
};
