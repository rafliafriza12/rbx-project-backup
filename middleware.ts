// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// ============================================
// Rate Limiting Configuration (Anti-DDoS)
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store: "IP:pathGroup" -> { count, resetTime }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit tiers per endpoint group
const RATE_LIMIT_TIERS: { prefix: string; max: number; windowMs: number }[] = [
  // Auth - ketat (anti brute force)
  { prefix: "/api/auth/login", max: 5, windowMs: 60_000 },
  { prefix: "/api/auth/register", max: 3, windowMs: 60_000 },
  { prefix: "/api/auth/send-otp", max: 1, windowMs: 60_000 },
  { prefix: "/api/auth/verify-otp", max: 5, windowMs: 60_000 },
  { prefix: "/api/auth/forgot-password", max: 3, windowMs: 60_000 },
  { prefix: "/api/auth/google", max: 10, windowMs: 60_000 },
  { prefix: "/api/auth", max: 15, windowMs: 60_000 },

  // Checkout/Payment - ketat (anti abuse)
  { prefix: "/api/checkout", max: 10, windowMs: 60_000 },
  { prefix: "/api/orders/create", max: 5, windowMs: 60_000 },
  // { prefix: "/api/buy-pass", max: 120, windowMs: 60_000 },

  // Transaction - sedang
  { prefix: "/api/transactions", max: 20, windowMs: 60_000 },

  // Cart - sedang
  { prefix: "/api/cart", max: 30, windowMs: 60_000 },

  // Chat - sedang
  { prefix: "/api/chat", max: 30, windowMs: 60_000 },

  // Upload - ketat
  { prefix: "/api/upload", max: 5, windowMs: 60_000 },

  // Admin - sedang
  { prefix: "/api/admin", max: 30, windowMs: 60_000 },

  // Roblox lookup - sedang (external API calls)
  { prefix: "/api/user-info", max: 15, windowMs: 60_000 },
  { prefix: "/api/get-user-places", max: 15, windowMs: 60_000 },
  { prefix: "/api/check-gamepass", max: 10, windowMs: 60_000 },

  // User profile
  { prefix: "/api/user", max: 20, windowMs: 60_000 },

  // Push notifications
  { prefix: "/api/push", max: 15, windowMs: 60_000 },

  // Public read endpoints - longgar
  { prefix: "/api/settings", max: 60, windowMs: 60_000 },
  { prefix: "/api/banners", max: 60, windowMs: 60_000 },
  { prefix: "/api/gamepass", max: 60, windowMs: 60_000 },
  { prefix: "/api/products", max: 60, windowMs: 60_000 },
  { prefix: "/api/reviews", max: 60, windowMs: 60_000 },
  { prefix: "/api/live-transactions", max: 60, windowMs: 60_000 },
  { prefix: "/api/robux-pricing", max: 60, windowMs: 60_000 },
  { prefix: "/api/rbx5-stats", max: 60, windowMs: 60_000 },
  { prefix: "/api/reseller-packages", max: 60, windowMs: 60_000 },
  { prefix: "/api/payment-methods", max: 60, windowMs: 60_000 },
  { prefix: "/api/joki", max: 60, windowMs: 60_000 },
  { prefix: "/api/leaderboard", max: 60, windowMs: 60_000 },
];

// Default rate limit for unmatched API routes
const DEFAULT_RATE_LIMIT = { max: 40, windowMs: 60_000 };

// Paths excluded from rate limiting (external webhooks/callbacks)
const RATE_LIMIT_EXCLUDED = [
  "/api/midtrans-notification",
  "/api/midtrans-config",
  "/api/duitku/callback",
  "/api/webhook",
  "/api/webhooks",
  "/api/pusher/auth",
  "/api/transactions/webhook",
  "/api/transactions/webhook/duitku",
  "/api/cron",
  "/api/auto-purchase",
  "/api/buy-pass",
];

// Cleanup expired entries every 2 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 120_000;

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitConfig(pathname: string): {
  max: number;
  windowMs: number;
} {
  for (const tier of RATE_LIMIT_TIERS) {
    if (pathname.startsWith(tier.prefix)) {
      return { max: tier.max, windowMs: tier.windowMs };
    }
  }
  return DEFAULT_RATE_LIMIT;
}

function isRateLimitExcluded(pathname: string): boolean {
  return RATE_LIMIT_EXCLUDED.some((p) => pathname.startsWith(p));
}

/**
 * Check rate limit for a request.
 * Returns NextResponse(429) if exceeded, null if OK.
 */
function checkRateLimit(
  request: NextRequest,
  pathname: string,
): { response: NextResponse | null; remaining: number; limit: number } {
  const ip = getClientIP(request);
  const config = getRateLimitConfig(pathname);

  // Group key: IP + first 3-4 path segments (e.g. "1.2.3.4:/api/auth/login")
  const pathGroup = pathname.split("/").slice(0, 4).join("/");
  const key = `${ip}:${pathGroup}`;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { response: null, remaining: config.max - 1, limit: config.max };
  }

  if (entry.count >= config.max) {
    // Exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    const res = NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      },
    );
    return { response: res, remaining: 0, limit: config.max };
  }

  // Increment
  entry.count++;
  const remaining = config.max - entry.count;
  return { response: null, remaining, limit: config.max };
}

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
  // 0. Rate Limiting (Anti-DDoS) — API routes only
  // ========================================
  if (pathname.startsWith("/api") && !isRateLimitExcluded(pathname)) {
    cleanupExpiredEntries();

    const {
      response: rateLimitResponse,
      remaining,
      limit,
    } = checkRateLimit(request, pathname);

    if (rateLimitResponse) {
      return rateLimitResponse; // 429 Too Many Requests
    }

    // For API routes that pass through below (non-admin),
    // we need to attach rate limit headers.
    // We'll store them and apply at the end.
  }

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
