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
 * Server Action: Fetch robux price setting
 */
export async function fetchRobuxSetting() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/robux-setting`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
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
 * Server Action: Fetch all gamepasses (admin view)
 */
export async function fetchGamepassesAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/gamepass?admin=true`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching gamepasses:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil data gamepass" },
    };
  }
}

/**
 * Server Action: Create a new gamepass
 */
export async function createGamepass(payload: object) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/gamepass`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error creating gamepass:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal membuat gamepass" },
    };
  }
}

/**
 * Server Action: Update an existing gamepass
 */
export async function updateGamepass(id: string, payload: object) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/gamepass/${id}`, {
      method: "PUT",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating gamepass:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal memperbarui gamepass" },
    };
  }
}

/**
 * Server Action: Delete a gamepass
 */
export async function deleteGamepass(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/gamepass/${id}`, {
      method: "DELETE",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting gamepass:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal menghapus gamepass" },
    };
  }
}

/**
 * Server Action: Toggle homepage visibility for a gamepass
 */
export async function toggleGamepassHomepage(
  id: string,
  showOnHomepage: boolean,
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/gamepass/${id}/homepage`, {
      method: "PATCH",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify({ showOnHomepage }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error toggling gamepass homepage:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengubah status homepage" },
    };
  }
}
