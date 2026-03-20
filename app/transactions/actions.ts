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
 * Server Action: Fetch transactions list (admin)
 */
export async function fetchTransactionsList(queryParams: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions?${queryParams}`,
      {
        headers: getInternalHeaders({
          ...(authCookie ? { Cookie: authCookie } : {}),
        }),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching transactions:", error);
    return { success: false, error: "Gagal mengambil data transaksi" };
  }
}
