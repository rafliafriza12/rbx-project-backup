import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { sendPushNotificationToMany } from "@/lib/webpush";
import { authenticateToken } from "@/lib/auth";

/**
 * POST /api/push/test
 * Send test push notification to current user
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`[Test Push] 🧪 Testing push for user: ${user._id}`);

    // Get all active subscriptions for this user
    const subscriptions = await PushSubscription.find({
      userId: user._id,
      isActive: true,
    });

    console.log(`[Test Push] 📱 Found ${subscriptions.length} active subscription(s)`);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No active subscriptions found. Please enable notifications first.",
      }, { status: 404 });
    }

    // Prepare test push notification
    const pushPayload = {
      title: "🧪 Test Notification",
      body: "Ini adalah test push notification. Jika Anda melihat ini, artinya push notification berhasil!",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "test-notification",
      data: {
        url: "/chat",
        testId: Date.now().toString(),
      },
    };

    console.log(`[Test Push] 📤 Sending to ${subscriptions.length} device(s)...`);

    // Send to all devices
    const result = await sendPushNotificationToMany(
      subscriptions.map(s => s.subscription),
      pushPayload
    );

    console.log(`[Test Push] ✅ Result: ${result.success} succeeded, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      message: "Test push sent",
      sent: result.success,
      failed: result.failed,
      totalSubscriptions: subscriptions.length,
    });
  } catch (error: any) {
    console.error("[Test Push] ❌ Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
