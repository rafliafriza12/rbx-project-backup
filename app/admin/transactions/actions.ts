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
 * Server Action: Fetch all transactions (admin)
 */
export async function fetchTransactionsAdmin(params: Record<string, string>) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/transactions?${query}`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching transactions:", error);
    return { ok: false, data: { error: "Gagal mengambil data transaksi" } };
  }
}

/**
 * Server Action: Update transaction status (admin)
 */
export async function updateTransactionStatus(
  transactionId: string,
  payload: {
    statusType: "payment" | "order";
    newStatus: string;
    notes?: string;
    updatedBy?: string;
  },
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/${transactionId}`,
      {
        method: "PUT",
        headers: getInternalHeaders({
          ...(authCookie ? { Cookie: authCookie } : {}),
        }),
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating transaction status:", error);
    return { ok: false, data: { error: "Gagal mengupdate status transaksi" } };
  }
}

/**
 * Server Action: Fetch single transaction by ID (admin)
 */
export async function fetchTransactionById(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/transactions/${id}`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
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
 * Server Action: Trigger manual gamepass purchase (admin)
 */
export async function triggerManualGamepassPurchase(transactionId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/${transactionId}/manual-gamepass-purchase`,
      {
        method: "POST",
        headers: getInternalHeaders({
          ...(authCookie ? { Cookie: authCookie } : {}),
        }),
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error(
      "[Server Action] Error triggering manual gamepass purchase:",
      error,
    );
    return {
      ok: false,
      data: { error: "Gagal memproses pembelian gamepass manual" },
    };
  }
}
