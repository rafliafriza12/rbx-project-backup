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
 * Server Action: Fetch all banners (admin)
 */
export async function fetchBannersAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/banners`, {
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching banners:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengambil data banner" },
    };
  }
}

/**
 * Server Action: Create new banner
 */
export async function createBanner(payload: {
  imageUrl: string;
  link: string;
  alt: string;
  isActive: boolean;
  order: number;
}) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/banners`, {
      method: "POST",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error creating banner:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal membuat banner" },
    };
  }
}

/**
 * Server Action: Update banner by ID
 */
export async function updateBanner(
  id: string,
  payload: {
    imageUrl: string;
    link: string;
    alt: string;
    isActive: boolean;
    order: number;
  },
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/banners/${id}`, {
      method: "PUT",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating banner:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengupdate banner" },
    };
  }
}

/**
 * Server Action: Delete banner by ID
 */
export async function deleteBanner(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/banners/${id}`, {
      method: "DELETE",
      headers: getInternalHeaders({
        ...(authCookie ? { Cookie: authCookie } : {}),
      }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting banner:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal menghapus banner" },
    };
  }
}

/**
 * Server Action: Upload banner image to Cloudinary
 * Note: FormData cannot be passed directly as server action arg from client,
 * so we accept the raw file bytes + metadata and rebuild on server.
 */
export async function uploadBannerImage(formData: FormData) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();

    const response = await fetch(`${BASE_URL}/api/upload/banner`, {
      method: "POST",
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        ...(authCookie ? { Cookie: authCookie } : {}),
        // NOTE: Do NOT set Content-Type for multipart/form-data — browser sets it with boundary
      },
      body: formData,
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error uploading banner image:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal mengupload gambar" },
    };
  }
}
