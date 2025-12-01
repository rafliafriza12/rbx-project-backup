"use client";

import { useState, useEffect } from "react";

export default function PushTestPage() {
  const [status, setStatus] = useState<any>({
    swSupported: false,
    swRegistered: false,
    swActive: false,
    pushSupported: false,
    pushSubscribed: false,
    notificationPermission: "default",
    subscription: null,
    debugInfo: null,
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const newStatus: any = {
      swSupported: "serviceWorker" in navigator,
      pushSupported: "PushManager" in window,
      notificationPermission: "Notification" in window ? Notification.permission : "not-supported",
    };

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        newStatus.swRegistered = !!registration;
        newStatus.swActive = registration?.active !== null;

        if (registration?.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          newStatus.pushSubscribed = !!subscription;
          newStatus.subscription = subscription;
        }
      } catch (error) {
        console.error("Error checking SW:", error);
      }
    }

    // Get debug info from server
    try {
      const response = await fetch("/api/push/debug");
      if (response.ok) {
        const data = await response.json();
        newStatus.debugInfo = data;
      }
    } catch (error) {
      console.error("Error fetching debug info:", error);
    }

    setStatus(newStatus);
  };

  const registerServiceWorker = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registered:", registration);
      await checkStatus();
      alert("Service Worker registered successfully!");
    } catch (error: any) {
      console.error("❌ Service Worker registration failed:", error);
      alert("Failed to register Service Worker: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      setLoading(true);

      // Check permission
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Notification permission denied");
          return;
        }
      }

      // Get VAPID public key
      const vapidResponse = await fetch("/api/push/vapid-public-key");
      if (!vapidResponse.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("✅ Push subscription:", subscription);

      // Save to server
      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save subscription");
      }

      await checkStatus();
      alert("Successfully subscribed to push notifications!");
    } catch (error: any) {
      console.error("❌ Push subscription failed:", error);
      alert("Failed to subscribe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestPush = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        alert(`Test push sent to ${data.sent} device(s)!`);
      } else {
        alert("Failed to send test push: " + data.error);
      }
    } catch (error: any) {
      console.error("❌ Test push failed:", error);
      alert("Failed to send test push: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      }

      await checkStatus();
      alert("Unsubscribed successfully!");
    } catch (error: any) {
      console.error("❌ Unsubscribe failed:", error);
      alert("Failed to unsubscribe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Push Notification Test Page</h1>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Status</h2>
          <div className="space-y-2">
            <StatusItem label="Service Worker Support" value={status.swSupported} />
            <StatusItem label="Service Worker Registered" value={status.swRegistered} />
            <StatusItem label="Service Worker Active" value={status.swActive} />
            <StatusItem label="Push API Support" value={status.pushSupported} />
            <StatusItem label="Push Subscribed" value={status.pushSubscribed} />
            <StatusItem label="Notification Permission" value={status.notificationPermission} />
          </div>
        </div>

        {/* Debug Info */}
        {status.debugInfo && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🐛 Server Debug Info</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(status.debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Subscription Details */}
        {status.subscription && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📱 Subscription Details</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(status.subscription.toJSON(), null, 2)}
            </pre>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {testResult.success ? "✅" : "❌"} Test Result
            </h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🎯 Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              🔄 Refresh Status
            </button>

            <button
              onClick={registerServiceWorker}
              disabled={loading || status.swRegistered}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              📝 Register Service Worker
            </button>

            <button
              onClick={subscribeToPush}
              disabled={loading || !status.swRegistered || status.pushSubscribed}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              🔔 Subscribe to Push
            </button>

            <button
              onClick={sendTestPush}
              disabled={loading || !status.pushSubscribed}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              🧪 Send Test Push
            </button>

            <button
              onClick={unsubscribe}
              disabled={loading || !status.pushSubscribed}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              🚫 Unsubscribe
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">📖 Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "Register Service Worker" if not registered</li>
            <li>Click "Subscribe to Push" and grant permission</li>
            <li>Click "Send Test Push"</li>
            <li><strong>Close this browser completely</strong></li>
            <li>Click "Send Test Push" from another device/browser</li>
            <li>You should receive notification even with browser closed!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: any }) {
  const displayValue = typeof value === "boolean" 
    ? (value ? "✅ Yes" : "❌ No")
    : String(value);
  
  const color = typeof value === "boolean"
    ? (value ? "text-green-400" : "text-red-400")
    : "text-blue-400";

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}:</span>
      <span className={`font-semibold ${color}`}>{displayValue}</span>
    </div>
  );
}

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
