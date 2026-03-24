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
 * Server Action: Fetch admin settings (GET /api/settings)
 */
export async function fetchSettingsAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching settings:", error);
    return {
      ok: false,
      data: { error: "Gagal mengambil settings" },
    };
  }
}

/**
 * Server Action: Update admin settings (PUT /api/settings)
 */
export async function updateSettingsAdmin(settings: Record<string, any>) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating settings:", error);
    return {
      ok: false,
      data: { error: "Gagal mengupdate settings" },
    };
  }
}

/**
 * Server Action: Reset settings to default (POST /api/settings)
 */
export async function resetSettingsAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error resetting settings:", error);
    return {
      ok: false,
      data: { error: "Gagal mereset settings" },
    };
  }
}

/**
 * Server Action: Send test email (POST /api/email/test)
 */
export async function sendTestEmail(testEmail: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/email/test`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: JSON.stringify({ testEmail }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error sending test email:", error);
    return {
      ok: false,
      data: { error: "Terjadi kesalahan saat test email" },
    };
  }
}
