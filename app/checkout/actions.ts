"use server";

import { cookies } from "next/headers";

function getBaseUrl(): string {
  // Server-side: use internal URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getInternalHeaders(
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
    ...extraHeaders,
  };
}

/**
 * Get user's auth cookie to forward to API routes
 */
async function getAuthCookie(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return token ? `token=${token.value}` : "";
}

/**
 * Server Action: Fetch public settings (active payment gateway, etc.)
 */
export async function fetchPaymentSettings() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/settings/public`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching payment settings:", error);
    return { success: false, error: "Gagal mengambil pengaturan pembayaran" };
  }
}

/**
 * Server Action: Fetch payment methods filtered by active gateway
 */
export async function fetchPaymentMethods(gateway: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/payment-methods?active=true&gateway=${gateway}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching payment methods:", error);
    return { success: false, error: "Gagal mengambil metode pembayaran" };
  }
}

/**
 * Server Action: Create a single transaction
 */
export async function createTransaction(requestData: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/transactions`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(requestData),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error creating transaction:", error);
    return { success: false, error: "Gagal membuat transaksi" };
  }
}

/**
 * Server Action: Create multiple transactions (multi-checkout from cart)
 */
export async function createMultiTransaction(requestData: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/transactions/multi`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(requestData),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error creating multi transaction:", error);
    return { success: false, error: "Gagal membuat multi transaksi" };
  }
}

/**
 * Server Action: Clear cart items after successful checkout
 */
export async function clearCartItems(userId: string, itemIds: string[]) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/cart/clear-items`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify({ userId, itemIds }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error clearing cart items:", error);
    return { success: false, error: "Gagal menghapus item dari keranjang" };
  }
}
