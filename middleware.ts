// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

/**
 * Verify JWT token in middleware (Edge Runtime compatible using jose).
 * Returns decoded payload or null.
 */
async function verifyTokenEdge(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ========================================
  // 1. Admin API routes - require valid JWT token
  // ========================================
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const decoded = await verifyTokenEdge(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized: Token tidak valid atau expired" },
        { status: 401 },
      );
    }

    // Token valid - allow through (per-route handlers will check admin role)
    return NextResponse.next();
  }

  // ========================================
  // 2. Admin pages - require valid JWT token AND admin role
  // ========================================
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const decoded = await verifyTokenEdge(token);

    if (!decoded) {
      // Token invalid/expired - redirect to login
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Check if user has admin role
    if (decoded.accessRole !== "admin") {
      // User is authenticated but not an admin - redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // Maintenance page itself should always be accessible
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  // Other API routes should pass through
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

  // Clean up any stale maintenance_mode cookie (no longer used by middleware)
  const staleMaintenanceCookie = request.cookies.get("maintenance_mode");
  if (staleMaintenanceCookie) {
    const response = NextResponse.next();
    response.cookies.delete("maintenance_mode");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
