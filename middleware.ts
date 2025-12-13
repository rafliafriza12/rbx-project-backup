// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin routes and admin login bypass maintenance check
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Maintenance page itself should always be accessible
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  // API routes should pass through (needed for maintenance check API)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static files should pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode from cookie
  // Cookie is set by MaintenanceChecker component after fetching from database
  const maintenanceCookie = request.cookies.get("maintenance_mode");

  if (maintenanceCookie?.value === "true") {
    // Redirect to maintenance page
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api (API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
