import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware protects app and admin routes:
 * - /app/:path* requires authenticated, non-disabled users
 * - /admin/:path* requires authenticated admins who are not disabled
 */
export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const requiresAdmin = pathname.startsWith("/admin");
  const requiresAuth = requiresAdmin || pathname.startsWith("/app");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/api/auth/signin", origin);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (token.disabled) {
    return NextResponse.redirect(new URL("/disabled", origin));
  }

  if (requiresAdmin && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
