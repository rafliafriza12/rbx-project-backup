/**
 * Web Push Utility
 * Handles server-side web push notifications using web-push library
 */

import webpush from 'web-push';

// VAPID keys for authentication
// Generate these using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@rbxstore.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  url?: string;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('[Web Push] VAPID keys not configured');
      return false;
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'notification',
      data: {
        ...payload.data,
        url: payload.url || '/chat',
      },
    });

    await webpush.sendNotification(subscription, pushPayload);
    console.log('[Web Push] ✅ Notification sent successfully');
    return true;
  } catch (error: any) {
    console.error('[Web Push] ❌ Error sending notification:', error);
    
    // Handle expired subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('[Web Push] Subscription expired or invalid');
      // TODO: Remove this subscription from database
    }
    
    return false;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushNotificationToMany(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const promises = subscriptions.map(async (subscription) => {
    const sent = await sendPushNotification(subscription, payload);
    if (sent) {
      success++;
    } else {
      failed++;
    }
  });

  await Promise.all(promises);

  console.log(`[Web Push] Sent to ${success}/${subscriptions.length} devices`);
  
  return { success, failed };
}

/**
 * Get VAPID public key (for client-side subscription)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if web push is configured
 */
export function isWebPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
