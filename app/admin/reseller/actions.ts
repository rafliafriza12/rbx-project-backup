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
 * Server Action: Fetch all reseller packages (admin view)
 */
export async function fetchResellerPackagesAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/reseller-packages?admin=true`,
      {
        headers: getInternalHeaders({
          ...(authCookie ? { Cookie: authCookie } : {}),
        }),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching reseller packages:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil data paket reseller" },
    };
  }
}

/**
 * Server Action: Create a new reseller package
 */
export async function createResellerPackage(payload: object) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/reseller-packages`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error creating reseller package:", error);
    return {
      ok: false,
      data: { error: "Gagal membuat paket reseller" },
    };
  }
}

/**
 * Server Action: Update a reseller package by ID
 */
export async function updateResellerPackage(id: string, payload: object) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/reseller-packages/${id}`, {
      method: "PUT",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating reseller package:", error);
    return {
      ok: false,
      data: { error: "Gagal mengupdate paket reseller" },
    };
  }
}

/**
 * Server Action: Delete a reseller package by ID
 */
export async function deleteResellerPackage(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/reseller-packages/${id}`, {
      method: "DELETE",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting reseller package:", error);
    return {
      ok: false,
      data: { error: "Gagal menghapus paket reseller" },
    };
  }
}
