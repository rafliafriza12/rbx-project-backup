import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron job to deactivate expired reseller tiers
 * This endpoint should be called periodically (e.g., daily via cron)
 * to automatically reset resellerTier to null for expired accounts
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Find all users with expired reseller tiers
    const expiredResellers = await User.find({
      resellerTier: { $ne: null, $exists: true },
      resellerExpiry: { $lt: new Date() }, // Expired
    });

    console.log(`Found ${expiredResellers.length} expired reseller accounts`);

    // Deactivate each expired reseller
    const deactivatedUsers = [];
    for (const user of expiredResellers) {
      const previousTier = user.resellerTier;
      const expiredDate = user.resellerExpiry;

      // Reset reseller fields
      user.resellerTier = null;
      user.resellerExpiry = null;
      user.resellerPackageId = null;
      await user.save();

      deactivatedUsers.push({
        userId: user._id,
        email: user.email,
        previousTier,
        expiredDate,
        deactivatedAt: new Date(),
      });

      console.log(
        `✅ Deactivated reseller for user ${user.email}: ` +
          `Tier ${previousTier} expired on ${expiredDate}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully deactivated ${deactivatedUsers.length} expired reseller accounts`,
        deactivatedUsers,
        totalProcessed: expiredResellers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deactivating expired resellers:", error);
    return NextResponse.json(
      {
        error: "Failed to deactivate expired resellers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check expired resellers without deactivating
 * Useful for monitoring and preview
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Find all users with expired reseller tiers
    const expiredResellers = await User.find({
      resellerTier: { $ne: null, $exists: true },
      resellerExpiry: { $lt: new Date() }, // Expired
    }).select("email firstName lastName resellerTier resellerExpiry");

    console.log(`Found ${expiredResellers.length} expired reseller accounts`);

    const expiredList = expiredResellers.map((user) => ({
      userId: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      tier: user.resellerTier,
      expiredDate: user.resellerExpiry,
      daysExpired: Math.floor(
        (new Date().getTime() - new Date(user.resellerExpiry!).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json(
      {
        success: true,
        totalExpired: expiredResellers.length,
        expiredResellers: expiredList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking expired resellers:", error);
    return NextResponse.json(
      {
        error: "Failed to check expired resellers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
