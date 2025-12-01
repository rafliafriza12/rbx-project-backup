import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { authenticateToken } from "@/lib/auth";

/**
 * POST /api/push/subscribe
 * Subscribe user to push notifications
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

    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId: user._id,
      "subscription.endpoint": subscription.endpoint,
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.subscription = subscription;
      existingSubscription.userAgent = userAgent;
      existingSubscription.isActive = true;
      existingSubscription.lastUsed = new Date();
      await existingSubscription.save();

      console.log(`[Push Subscribe] ✅ Updated subscription for user ${user._id}`);

      return NextResponse.json({
        success: true,
        message: "Subscription updated",
        subscriptionId: existingSubscription._id,
      });
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      userId: user._id,
      userRole: user.role,
      subscription,
      userAgent,
      isActive: true,
      lastUsed: new Date(),
    });

    await newSubscription.save();

    console.log(`[Push Subscribe] ✅ New subscription created for user ${user._id}`);

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      subscriptionId: newSubscription._id,
    });
  } catch (error: any) {
    console.error("[Push Subscribe] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint required" },
        { status: 400 }
      );
    }

    // Mark subscription as inactive
    await PushSubscription.updateOne(
      {
        userId: user._id,
        "subscription.endpoint": endpoint,
      },
      {
        isActive: false,
      }
    );

    console.log(`[Push Unsubscribe] ✅ Unsubscribed user ${user._id}`);

    return NextResponse.json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error: any) {
    console.error("[Push Unsubscribe] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
