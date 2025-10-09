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

  // API routes should pass through
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

  // Check maintenance mode for all other routes (public, auth, etc)
  try {
    const baseUrl = request.nextUrl.origin;
    const maintenanceResponse = await fetch(`${baseUrl}/api/maintenance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Use cache: no-store to always get fresh data
      cache: "no-store",
    });

    if (maintenanceResponse.ok) {
      const data = await maintenanceResponse.json();

      if (data.maintenanceMode === true) {
        // Redirect to maintenance page
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    // If there's an error checking maintenance mode, allow access
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/maintenance (the endpoint itself)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
