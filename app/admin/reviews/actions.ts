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
 * Fetch admin reviews list
 */
export async function fetchAdminReviews(params: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/reviews?${params}`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching admin reviews:", error);
    return { ok: false, data: { success: false } };
  }
}

/**
 * Bulk action on reviews (approve/reject)
 */
export async function bulkReviewAction(reviewIds: string[], action: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/reviews`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ reviewIds, action }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error bulk review action:", error);
    return { ok: false, data: { success: false } };
  }
}

/**
 * Bulk delete reviews
 */
export async function bulkDeleteReviews(reviewIds: string[]) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/reviews`, {
      method: "DELETE",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ reviewIds }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error bulk delete reviews:", error);
    return { ok: false, data: { success: false } };
  }
}

/**
 * Single review action (approve/reject)
 */
export async function singleReviewAction(reviewId: string, action: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ action }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error single review action:", error);
    return { ok: false, data: { success: false } };
  }
}

/**
 * Delete single review
 */
export async function deleteSingleReview(reviewId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({}),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting review:", error);
    return { ok: false, data: { success: false } };
  }
}
