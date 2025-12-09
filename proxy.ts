import { NextResponse, proxy, type NextRequest } from "next/server";

import { requireAdmin, requireUser } from "@/server/auth/requireUser";

export const runtime = "nodejs";

export default proxy(async (request: NextRequest) => {
  const { pathname, origin } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const requiresAuth = isAdminRoute || pathname.startsWith("/app");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  try {
    if (isAdminRoute) {
      await requireAdmin();
      return NextResponse.next();
    }

    await requireUser();
    return NextResponse.next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("disabled")) {
      return NextResponse.redirect(new URL("/disabled", origin));
    }

    if (message.includes("admin access required")) {
      return NextResponse.redirect(new URL("/app", origin));
    }

    const signInUrl = new URL("/auth/signin", origin);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
