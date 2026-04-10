"use server";

import { cookies } from "next/headers";

function getBaseUrl(): string {
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

async function getAuthCookie(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return token ? `token=${token.value}` : "";
}

/**
 * Server Action: Fetch all payment methods (admin)
 */
export async function fetchPaymentMethodsAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/payment-methods`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching payment methods:", error);
    return { success: false, error: "Gagal mengambil payment methods" };
  }
}

/**
 * Server Action: Create or Update payment method (admin)
 */
export async function savePaymentMethod(data: any, methodId?: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const url = methodId
      ? `${BASE_URL}/api/payment-methods/${methodId}`
      : `${BASE_URL}/api/payment-methods`;
    const method = methodId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error saving payment method:", error);
    return { success: false, error: "Gagal menyimpan payment method" };
  }
}

/**
 * Server Action: Delete payment method (admin)
 */
export async function deletePaymentMethod(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/payment-methods/${id}`, {
      method: "DELETE",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error deleting payment method:", error);
    return { success: false, error: "Gagal menghapus payment method" };
  }
}

/**
 * Server Action: Toggle active status of payment method (admin)
 */
export async function togglePaymentMethodActive(method: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/payment-methods/${method._id}`,
      {
        method: "PUT",
        headers: getInternalHeaders({
          ...(authCookie ? { Cookie: authCookie } : {}),
        }),
        body: JSON.stringify({
          ...method,
          isActive: !method.isActive,
        }),
      },
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error toggling payment method:", error);
    return { success: false, error: "Gagal mengubah status payment method" };
  }
}
