/**
 * Web Push Notifications Utility
 * Handles browser notifications for chat messages
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 * Returns the permission status after request
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a notification
 * Automatically requests permission if not yet granted
 */
export async function showNotification(options: NotificationOptions): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  // Check if permission is granted
  let permission = Notification.permission;
  
  if (permission === 'default') {
    // Don't auto-request here - let user explicitly enable
    console.log('Notification permission not yet requested');
    return false;
  }

  if (permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  if (permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || 'chat-notification',
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    });

    // Auto-close after 5 seconds if not requireInteraction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      
      // Focus the window
      window.focus();
      
      // Navigate to chat if data contains roomId
      if (options.data?.roomId) {
        // For admin
        if (window.location.pathname.includes('/admin/chat')) {
          // Trigger custom event to switch room
          window.dispatchEvent(new CustomEvent('notification-click', {
            detail: { roomId: options.data.roomId }
          }));
        }
        // For user - already on their chat page
      }
      
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Show notification for new chat message
 */
export async function showChatNotification(params: {
  senderName: string;
  message: string;
  roomId: string;
  isImage?: boolean;
}): Promise<boolean> {
  const { senderName, message, roomId, isImage } = params;

  return showNotification({
    title: `Pesan baru dari ${senderName}`,
    body: isImage ? '📷 Mengirim gambar' : message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `chat-${roomId}`,
    data: { roomId },
    requireInteraction: false,
    silent: false,
  });
}

/**
 * Check if current tab is focused
 */
export function isTabFocused(): boolean {
  return document.hasFocus();
}

/**
 * Check if current tab is visible
 */
export function isTabVisible(): boolean {
  return !document.hidden;
}

/**
 * Should show notification?
 * Only show if tab is not focused or not visible
 */
export function shouldShowNotification(): boolean {
  return !isTabFocused() || !isTabVisible();
}

/**
 * Get user preference for notifications from localStorage
 */
export function getNotificationPreference(): boolean {
  if (typeof window === 'undefined') return false;
  
  const preference = localStorage.getItem('chat-notifications-enabled');
  
  // Default to true if not set
  if (preference === null) {
    return true;
  }
  
  return preference === 'true';
}

/**
 * Save user preference for notifications to localStorage
 */
export function setNotificationPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('chat-notifications-enabled', enabled.toString());
}

/**
 * Clear notification by tag
 */
export function clearNotification(tag: string): void {
  // Note: Web Notifications API doesn't provide a way to programmatically
  // clear notifications. They auto-close or user dismisses them.
  // This is a placeholder for future service worker implementation
  console.log(`Notification with tag ${tag} will auto-close`);
}
