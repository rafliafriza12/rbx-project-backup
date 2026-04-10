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
 * Server Action: Fetch robux pricing (GET /api/robux-pricing)
 */
export async function fetchRobuxPricingAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/robux-pricing`, {
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching robux pricing:", error);
    return {
      ok: false,
      data: { success: false, message: "Gagal mengambil data harga Robux" },
    };
  }
}

/**
 * Server Action: Save robux pricing (POST or PUT /api/robux-pricing)
 */
export async function saveRobuxPricing(
  payload: { pricePerHundred: number; description: string },
  isUpdate: boolean,
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const method = isUpdate ? "PUT" : "POST";

    const response = await fetch(`${BASE_URL}/api/robux-pricing`, {
      method,
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error saving robux pricing:", error);
    return {
      ok: false,
      data: { success: false, message: "Gagal menyimpan harga Robux" },
    };
  }
}

/**
 * Server Action: Fetch robux setting / gamepass pricing (GET /api/robux-setting)
 */
export async function fetchRobuxSettingAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/robux-setting`, {
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching robux setting:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil setting Robux" },
    };
  }
}

/**
 * Server Action: Update robux setting / gamepass pricing (PUT /api/robux-setting)
 */
export async function saveRobuxSetting(payload: {
  pricePerRobux: number;
  updatedBy: string;
}) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/robux-setting`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error saving robux setting:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal memperbarui setting Robux" },
    };
  }
}
