"use server";

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
