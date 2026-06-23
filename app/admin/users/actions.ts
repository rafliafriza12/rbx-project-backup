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
 * Fetch all users (admin)
 */
export async function fetchUsersAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/users?limit=10000`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error fetching users:", error);
    return { ok: false, data: { error: "Error fetching users" } };
  }
}

/**
 * Save user (create or update)
 */
export async function saveUser(
  userId: string | null,
  payload: Record<string, any>,
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const url = userId
      ? `${BASE_URL}/api/admin/users/${userId}`
      : `${BASE_URL}/api/admin/users`;
    const method = userId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error saving user:", error);
    return { ok: false, data: { error: "Error saving user" } };
  }
}

/**
 * Delete user (admin)
 */
export async function deleteUserAdmin(userId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error deleting user:", error);
    return { ok: false, data: { error: "Error deleting user" } };
  }
}

/**
 * Fetch all stock accounts (admin)
 */
export async function fetchStockAccountsAdmin() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/admin/stock-accounts`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error fetching stock accounts:", error);
    return { ok: false, data: { error: "Error fetching stock accounts" } };
  }
}

/**
 * Save stock account (create or update)
 */
export async function saveStockAccount(
  accountId: string | null,
  payload: Record<string, any>,
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const url = accountId
      ? `${BASE_URL}/api/admin/stock-accounts/${accountId}`
      : `${BASE_URL}/api/admin/stock-accounts`;
    const method = accountId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error saving stock account:", error);
    return { ok: false, data: { error: "Error saving stock account" } };
  }
}

/**
 * Delete stock account (admin)
 */
export async function deleteStockAccountAdmin(accountId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/admin/stock-accounts/${accountId}`,
      {
        method: "DELETE",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error deleting stock account:", error);
    return { ok: false, data: { error: "Error deleting stock account" } };
  }
}

/**
 * Impersonate user
 */
export async function impersonateUserAction(targetUserId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/auth/impersonate`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await response.json();

    // Forward Set-Cookie header from API to browser
    const setCookieHeader = response.headers.getSetCookie();
    if (setCookieHeader && setCookieHeader.length > 0) {
      const cookieStore = await cookies();
      for (const cookieStr of setCookieHeader) {
        const parts = cookieStr.split(";")[0];
        const [name, ...valueParts] = parts.split("=");
        const value = valueParts.join("=");
        if (name && value) {
          cookieStore.set(name.trim(), value.trim(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
          });
        }
      }
    }

    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error impersonating user:", error);
    return { ok: false, data: { error: "Error impersonating user" } };
  }
}

/**
 * Trigger auto-purchase for pending transactions (admin)
 */
export async function triggerAutoPurchase(stockAccountId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/admin/stock-accounts/trigger-auto-purchase`,
      {
        method: "POST",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        body: JSON.stringify({ stockAccountId }),
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error triggering auto-purchase:", error);
    return { ok: false, data: { error: "Error triggering auto-purchase" } };
  }
}

/**
 * Setup 2FA otomatis untuk stock account (aktifkan TOTP + simpan secret)
 */
export async function setupTwoFAAction(stockAccountId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/admin/stock-accounts/setup-2fa`,
      {
        method: "POST",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        body: JSON.stringify({ stockAccountId }),
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error setting up 2FA:", error);
    return { ok: false, data: { error: "Error setting up 2FA" } };
  }
}

/**
 * Cek dan update status Robux Plus untuk satu akun stock
 */
export async function checkRobuxPlusAction(stockAccountId?: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/admin/stock-accounts/check-robux-plus`,
      {
        method: "POST",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        body: JSON.stringify({ stockAccountId }),
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error checking Robux Plus:", error);
    return { ok: false, data: { error: "Error checking Robux Plus" } };
  }
}

