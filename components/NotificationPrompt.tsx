"use client";

import { useState, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

interface NotificationPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export default function NotificationPrompt({
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPromptProps) {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  useEffect(() => {
    // Check if we should show the prompt
    if (!isNotificationSupported()) {
      return; // Don't show if browser doesn't support
    }

    const permission = getNotificationPermission();
    
    // Only show if permission is default (not yet asked)
    if (permission === "default") {
      // Check if user previously dismissed the prompt
      const dismissed = localStorage.getItem("notification-prompt-dismissed");
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    
    try {
      // Step 1: Request notification permission
      setCurrentStep("Meminta izin notifikasi...");
      const permission = await requestNotificationPermission();
      
      if (permission !== "granted") {
        setShow(false);
        onPermissionDenied?.();
        alert("❌ Izin notifikasi ditolak. Notifikasi tidak akan muncul.");
        return;
      }

      // Step 2: Register Service Worker
      setCurrentStep("Mendaftar Service Worker...");
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker not supported");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registered");

      // Wait for Service Worker to be ready
      await navigator.serviceWorker.ready;

      // Step 3: Get VAPID public key from server
      setCurrentStep("Mengambil kunci enkripsi...");
      const vapidResponse = await fetch("/api/push/vapid-public-key");
      if (!vapidResponse.ok) {
        throw new Error("Failed to get VAPID public key");
      }
      
      const { publicKey } = await vapidResponse.json();

      // Step 4: Subscribe to push notifications
      setCurrentStep("Mendaftar push notification...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("✅ Push subscription created");

      // Step 5: Send subscription to server
      setCurrentStep("Menyimpan ke server...");
      const subscribeResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error("Failed to save subscription");
      }

      const result = await subscribeResponse.json();
      console.log("✅ Subscription saved to server:", result);

      // Show success message
      alert("✅ Notifikasi berhasil diaktifkan!\n\n" +
            "Sekarang Anda akan menerima notifikasi push saat ada pesan baru masuk, " +
            "bahkan ketika browser ditutup atau Anda sedang membuka halaman lain.");

      setShow(false);
      onPermissionGranted?.();
    } catch (error: any) {
      console.error("Error setting up push notifications:", error);
      alert("❌ Gagal mengaktifkan notifikasi: " + error.message + "\n\n" +
            "Silakan coba lagi atau hubungi administrator.");
    } finally {
      setRequesting(false);
      setCurrentStep("");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Remember that user dismissed this
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="bg-white/20 text-white px-4 py-3 shadow-lg border-b border-white/10 rounded-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔔</div>
          <div>
            <p className="font-semibold">Aktifkan Notifikasi Push</p>
            <p className="text-sm text-white/80">
              {requesting 
                ? currentStep 
                : "Dapatkan notifikasi real-time bahkan saat browser ditutup"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requesting ? "⏳ Proses..." : "✨ Aktifkan"}
          </button>
          <button
            onClick={handleDismiss}
            disabled={requesting}
            className="text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}
