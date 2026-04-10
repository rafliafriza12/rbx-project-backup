"use server";

import { cookies } from "next/headers";

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

async function getAuthCookie(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return token ? `token=${token.value}` : "";
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

/**
 * Server Action: Fetch active banners (public)
 */
export async function getActiveBanners() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/banners?active=true`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching active banners:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch all gamepasses (public)
 */
export async function getGamepasses() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/gamepass`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching gamepasses:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch a single gamepass by ID (public)
 */
export async function getGamepassById(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/gamepass/${id}`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching gamepass by id:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch products by category (public)
 */
export async function getProductsByCategory(
  category: "robux_5_hari" | "robux_instant",
) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/products?category=${category}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching products:", error);
    return { products: [] };
  }
}

/**
 * Server Action: Fetch robux pricing (public)
 */
export async function getRobuxPricing() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/robux-pricing`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching robux pricing:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch rbx5 stats (public)
 */
export async function getRbx5Stats() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/rbx5-stats`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching rbx5 stats:", error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Fetch active reseller packages (public)
 */
export async function getResellerPackages() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/reseller-packages`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching reseller packages:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Fetch transaction by invoice ID (public)
 */
export async function getTransactionByInvoice(invoiceId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/transactions/invoice/${invoiceId}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error(
      "[Server Action] Error fetching transaction by invoice:",
      error,
    );
    return { ok: false, data: { error: "Gagal mengambil data transaksi" } };
  }
}

/**
 * Server Action: Fetch transaction by ID (public, user-facing)
 */
export async function getTransactionById(id: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: { error: "Unauthorized" } };
    const response = await fetch(`${BASE_URL}/api/transactions/${id}`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching transaction:", error);
    return { ok: false, data: { error: "Gagal mengambil data transaksi" } };
  }
}

/**
 * Server Action: Fetch user transactions (public, user-facing)
 */
export async function getUserTransactions(userId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/user/${userId}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching user transactions:", error);
    return { ok: false, data: { error: "Gagal mengambil riwayat transaksi" } };
  }
}

/**
 * Server Action: Search transactions (authenticated user)
 */
export async function searchTransactions(query: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/transactions/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error searching transactions:", error);
    return { ok: false, data: { success: false, data: [] } };
  }
}

/**
 * Server Action: Get user places from Roblox
 */
export async function getUserPlaces(userId: number) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/get-user-places?userId=${userId}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching user places:", error);
    return {
      ok: false,
      data: {
        success: false,
        message: "Terjadi kesalahan saat mengambil data place",
      },
    };
  }
}

/**
 * Server Action: Get user info from Roblox by username
 */
export async function getUserInfo(username: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/user-info?username=${encodeURIComponent(username)}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching user info:", error);
    return {
      ok: false,
      data: { success: false, message: "Terjadi kesalahan saat mencari user" },
    };
  }
}

/**
 * Server Action: Check gamepass for a place
 */
export async function checkGamepass(placeId: number, expectedRobux: number) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(
      `${BASE_URL}/api/check-gamepass?placeId=${placeId}&expectedRobux=${expectedRobux}`,
      {
        headers: getInternalHeaders(),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error checking gamepass:", error);
    return {
      ok: false,
      data: {
        success: false,
        message: "Terjadi kesalahan saat memeriksa gamepass",
      },
    };
  }
}

/**
 * Server Action: Fetch live transactions for homepage
 */
export async function getLiveTransactions() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/live-transactions`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching live transactions:", error);
    return {
      ok: false,
      data: { success: false, data: [] },
    };
  }
}

/**
 * Server Action: Fetch live reviews for homepage
 */
export async function getLiveReviews() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/reviews/live`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching live reviews:", error);
    return {
      ok: false,
      data: { success: false, data: [] },
    };
  }
}

/**
 * Server Action: Get current user data (authenticated)
 */
export async function getCurrentUser() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) {
      return { ok: false, data: null };
    }
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching current user:", error);
    return { ok: false, data: null };
  }
}

// =====================================================
// LEADERBOARD ACTIONS
// =====================================================

/**
 * Server Action: Get leaderboard data
 */
export async function getLeaderboardData(params: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/leaderboard?${params}`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching leaderboard:", error);
    return { success: false, message: "Gagal memuat data leaderboard" };
  }
}

// =====================================================
// MAINTENANCE ACTIONS
// =====================================================

/**
 * Server Action: Check maintenance status
 */
export async function checkMaintenanceStatus() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/maintenance`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    if (response.ok) {
      return await response.json();
    }
    return { maintenanceMode: false, maintenanceMessage: "" };
  } catch (error) {
    return { maintenanceMode: false, maintenanceMessage: "" };
  }
}

// =====================================================
// PUSH NOTIFICATION ACTIONS
// =====================================================

/**
 * Server Action: Get VAPID public key
 */
export async function getVapidPublicKey() {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/push/vapid-public-key`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching VAPID key:", error);
    return { success: false, error: "Failed to get VAPID key" };
  }
}

/**
 * Server Action: Subscribe to push notifications
 */
export async function subscribePush(subscription: any, userAgent: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ subscription, userAgent }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error subscribing push:", error);
    return {
      ok: false,
      data: { success: false, error: "Failed to subscribe" },
    };
  }
}

// =====================================================
// REVIEW ACTIONS (PUBLIC)
// =====================================================

/**
 * Server Action: Get public reviews
 */
export async function getPublicReviews(params: string) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/reviews?${params}`, {
      headers: getInternalHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error fetching reviews:", error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action: Submit a review
 */
export async function submitReview(payload: any) {
  try {
    const BASE_URL = getBaseUrl();
    const response = await fetch(`${BASE_URL}/api/reviews`, {
      method: "POST",
      headers: getInternalHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Server Action] Error submitting review:", error);
    return { success: false, error: "Terjadi kesalahan saat mengirim review" };
  }
}

// =====================================================
// PROFILE ACTIONS
// =====================================================

/**
 * Server Action: Get user profile
 */
export async function getUserProfile() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: { success: false } };
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching profile:", error);
    return { ok: false, data: { success: false } };
  }
}

/**
 * Server Action: Update user profile
 */
export async function updateUserProfile(formData: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: { success: false } };
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating profile:", error);
    return {
      ok: false,
      data: { success: false, error: "Gagal memperbarui profil" },
    };
  }
}

/**
 * Server Action: Get user stats
 */
export async function getUserStats(userId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    const response = await fetch(
      `${BASE_URL}/api/user/stats?userId=${encodeURIComponent(userId)}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    if (response.ok) {
      const result = await response.json();
      return result;
    }
    return { success: false };
  } catch (error) {
    console.error("[Server Action] Error fetching user stats:", error);
    return { success: false };
  }
}

// =====================================================
// CART ACTIONS
// =====================================================

/**
 * Server Action: Get cart items
 */
export async function getCartItems() {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: { items: [], total: 0 } };
    const response = await fetch(`${BASE_URL}/api/cart`, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching cart:", error);
    return { ok: false, data: { items: [], total: 0 } };
  }
}

/**
 * Server Action: Add item to cart
 */
export async function addToCartAction(item: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(item),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error adding to cart:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Update cart item quantity
 */
export async function updateCartQuantity(
  userId: string,
  itemId: string,
  quantity: number,
) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/cart/update`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ userId, itemId, quantity }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error updating cart:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Remove item from cart
 */
export async function removeCartItem(itemId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(
      `${BASE_URL}/api/cart?itemId=${encodeURIComponent(itemId)}`,
      {
        method: "DELETE",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error removing from cart:", error);
    return { ok: false, data: null };
  }
}

// =====================================================
// CHAT ACTIONS
// =====================================================

/**
 * Server Action: Get chat rooms
 */
export async function getChatRooms(params?: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const url = params
      ? `${BASE_URL}/api/chat/rooms?${params}`
      : `${BASE_URL}/api/chat/rooms`;
    const response = await fetch(url, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching chat rooms:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Create chat room
 */
export async function createChatRoom(body: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/rooms`, {
      method: "POST",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error creating chat room:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Delete chat room(s)
 */
export async function deleteChatRooms(roomIds: string[]) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/rooms`, {
      method: "DELETE",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify({ roomIds }),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting chat rooms:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Delete single chat room
 */
export async function deleteSingleChatRoom(roomId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error deleting chat room:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Toggle chat room status (PATCH)
 */
export async function toggleChatRoomStatus(roomId: string, body: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/rooms/${roomId}`, {
      method: "PATCH",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error toggling chat room:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Mark messages as read
 */
export async function markMessagesRead(roomId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/rooms/${roomId}/read`, {
      method: "PUT",
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error marking read:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Get chat messages
 */
export async function getChatMessages(roomId: string, params?: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const url = params
      ? `${BASE_URL}/api/chat/rooms/${roomId}/messages?${params}`
      : `${BASE_URL}/api/chat/rooms/${roomId}/messages`;
    const response = await fetch(url, {
      headers: {
        ...getInternalHeaders(),
        Cookie: authCookie,
      },
      cache: "no-store",
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error fetching messages:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Send chat message
 */
export async function sendChatMessage(roomId: string, body: any) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(
      `${BASE_URL}/api/chat/rooms/${roomId}/messages`,
      {
        method: "POST",
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        body: JSON.stringify(body),
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error sending message:", error);
    return { ok: false, data: null };
  }
}

/**
 * Server Action: Upload chat image
 */
export async function uploadChatImage(formData: FormData) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/chat/upload-image`, {
      method: "POST",
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        Cookie: authCookie,
      },
      body: formData,
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error uploading chat image:", error);
    return { ok: false, data: null };
  }
}

// =====================================================
// UPLOAD ACTIONS (ADMIN)
// =====================================================

/**
 * Server Action: Upload file (admin)
 */
export async function uploadFile(formData: FormData) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        Cookie: authCookie,
      },
      body: formData,
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error("[Server Action] Error uploading file:", error);
    return { ok: false, data: null };
  }
}

// =====================================================
// AUTO-PURCHASE ACTIONS (ADMIN)
// =====================================================

/**
 * Server Action: Get auto-purchase progress
 */
export async function getAutoPurchaseProgress(sessionId: string) {
  try {
    const BASE_URL = getBaseUrl();
    const authCookie = await getAuthCookie();
    if (!authCookie) return { ok: false, data: null };
    const response = await fetch(
      `${BASE_URL}/api/auto-purchase/progress/${sessionId}`,
      {
        headers: {
          ...getInternalHeaders(),
          Cookie: authCookie,
        },
        cache: "no-store",
      },
    );
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (error) {
    console.error(
      "[Server Action] Error fetching auto-purchase progress:",
      error,
    );
    return { ok: false, data: null };
  }
}
