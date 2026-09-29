import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

// Admin area: ADMIN only. Billing area: STAFF and ADMIN.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");
  const adminOnly = pathname.startsWith("/admin") || pathname.startsWith("/m") || pathname.startsWith("/api/admin");

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (adminOnly && session.role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/billing";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/m/:path*", "/billing/:path*", "/api/admin/:path*", "/api/billing/:path*"],
};
