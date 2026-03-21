"use server";

import { cookies } from "next/headers";

/**
 * Shared server actions for fetching public data
 * All fetch calls go through server with INTERNAL_API_SECRET
 */

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getInternalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
  };
}

async function getAuthCookie(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return token ? `token=${token.value}` : "";
}

/**
 * Server Action: Fetch public settings
 */
export async function getPublicSettings() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/settings/public`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching public settings:", error);
    return { success: false, error: "Gagal mengambil pengaturan" };
  }
}

/**
 * Server Action: Fetch active banners (public)
 */
export async function getActiveBanners() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/banners?active=true`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching active banners:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch all gamepasses (public)
 */
export async function getGamepasses() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/gamepass`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching gamepasses:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch a single gamepass by ID (public)
 */
export async function getGamepassById(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/gamepass/${id}`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching gamepass by id:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch products by category (public)
 */
export async function getProductsByCategory(
  category: "robux_5_hari" | "robux_instant",
) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/products?category=${category}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching products:", error);
    return { products: [] };
  }
}

/**
 * Server Action: Fetch robux pricing (public)
 */
export async function getRobuxPricing() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/robux-pricing`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching robux pricing:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch rbx5 stats (public)
 */
export async function getRbx5Stats() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/rbx5-stats`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching rbx5 stats:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch active reseller packages (public)
 */
export async function getResellerPackages() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/reseller-packages`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching reseller packages:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch transaction by invoice ID (public)
 */
export async function getTransactionByInvoice(invoiceId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/transactions/invoice/${invoiceId}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error(
      "[Server Action] Error fetching transaction by invoice:",
      error,
    );
    return { ok: false, data: { error: "Gagal mengambil data transaksi" } };
  }
}

/**
 * Server Action: Fetch transaction by ID (public, user-facing)
 */
export async function getTransactionById(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/transactions/${id}`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching transaction:", error);
    return { ok: false, data: { error: "Gagal mengambil data transaksi" } };
  }
}

/**
 * Server Action: Fetch user transactions (public, user-facing)
 */
export async function getUserTransactions(userId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/user/${userId}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching user transactions:", error);
    return { ok: false, data: { error: "Gagal mengambil riwayat transaksi" } };
  }
}

/**
 * Server Action: Search transactions (authenticated user)
 */
export async function searchTransactions(query: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error searching transactions:", error);
    return { ok: false, data: { success: false, data: [] } };
  }
}
