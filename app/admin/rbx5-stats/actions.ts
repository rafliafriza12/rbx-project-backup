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
 * Server Action: Fetch admin rbx5 stats config
 */
export async function fetchRbx5StatsConfig() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/rbx5-stats`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching rbx5 stats config:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil konfigurasi statistik" },
    };
  }
}

/**
 * Server Action: Fetch live rbx5 stats (public endpoint)
 */
export async function fetchRbx5StatsLive() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/rbx5-stats`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching live rbx5 stats:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil statistik live" },
    };
  }
}

/**
 * Server Action: Update rbx5 stats config
 */
export async function updateRbx5StatsConfig(payload: {
  mode: "auto" | "manual";
  manualTotalStok: number;
  manualTotalTerjual: number;
  manualTotalCustomers: number;
  updatedBy?: string;
}) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/rbx5-stats`, {
      method: "PUT",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating rbx5 stats config:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal menyimpan konfigurasi statistik" },
    };
  }
}
