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

// ============================================================
// Registration OTP
// ============================================================

/**
 * Send OTP for registration
 */
export async function sendOtp(email: string, firstName: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify({ email, firstName }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error sending OTP:", error);
    return { ok: false, data: { error: "Gagal mengirim OTP" } };
  }
}

/**
 * Verify OTP for registration
 */
export async function verifyOtp(email: string, otp: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error verifying OTP:", error);
    return { ok: false, data: { error: "Gagal memverifikasi OTP" } };
  }
}

// ============================================================
// Forgot Password OTP
// ============================================================

/**
 * Send OTP for forgot password
 */
export async function sendForgotPasswordOtp(email: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/auth/forgot-password/send-otp`,
      {
        method: "POST",
        headers: getInternalHeaders(),
        body: JSON.stringify({ email }),
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error sending forgot password OTP:", error);
    return { ok: false, data: { error: "Gagal mengirim OTP" } };
  }
}

/**
 * Verify OTP for forgot password
 */
export async function verifyForgotPasswordOtp(email: string, otp: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/auth/forgot-password/verify-otp`,
      {
        method: "POST",
        headers: getInternalHeaders(),
        body: JSON.stringify({ email, otp }),
      },
    );
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error(
      "[Server Action] Error verifying forgot password OTP:",
      error,
    );
    return { ok: false, data: { error: "Gagal memverifikasi OTP" } };
  }
}

/**
 * Reset password
 */
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
  confirmPassword: string,
) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password/reset`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error resetting password:", error);
    return { ok: false, data: { error: "Gagal reset password" } };
  }
}

// ============================================================
// Auth (login, register, google, me, logout)
// ============================================================

/**
 * Login
 */
export async function loginAction(
  email: string,
  password: string,
  rememberMe: boolean = false,
) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify({ email, password, rememberMe }),
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
            ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 } : {}),
          });
        }
      }
    }

    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error logging in:", error);
    return { ok: false, data: { error: "Terjadi kesalahan saat login" } };
  }
}

/**
 * Google login
 */
export async function googleLoginAction(payload: {
  email: string;
  name: string;
  picture: string;
  sub: string;
}) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify(payload),
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
          });
        }
      }
    }

    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error with Google login:", error);
    return { ok: false, data: { error: "Gagal login dengan Google" } };
  }
}

/**
 * Register
 */
export async function registerAction(userData: Record<string, any>) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify(userData),
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
          });
        }
      }
    }

    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error registering:", error);
    return { ok: false, data: { error: "Gagal mendaftar" } };
  }
}

/**
 * Check auth (get current user)
 */
export async function checkAuthAction() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error checking auth:", error);
    return { ok: false, data: { error: "Gagal memeriksa autentikasi" } };
  }
}

/**
 * Logout
 */
export async function logoutAction() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
    });
    const data = await response.json();

    // Clear the token cookie on server side
    if (response.ok) {
      const cookieStore = await cookies();
      cookieStore.delete("token");
    }

    return { ok: response.ok, data };
  } catch (error) {
    console.error("[Server Action] Error logging out:", error);
    return { ok: false, data: { error: "Gagal logout" } };
  }
}
