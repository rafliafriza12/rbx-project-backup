import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import { requireAdmin } from "@/lib/auth";

// Helper auth guard for admin
async function checkAdmin(request: NextRequest) {
  try {
    await requireAdmin(request);
    return null;
  } catch (authError: any) {
    const status = authError.message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: authError.message }, { status });
  }
}

// GET - Get all reviews for admin (including unapproved)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Auth check
    const authErr = await checkAdmin(request);
    if (authErr) return authErr;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // 'approved', 'pending', 'all'
    const serviceType = searchParams.get("serviceType");
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (status === "approved") {
      filter.isApproved = true;
    } else if (status === "pending") {
      filter.isApproved = false;
    }
    // 'all' means no filter on isApproved

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(filter);

    // Get stats
    const stats = {
      total: await Review.countDocuments(),
      approved: await Review.countDocuments({ isApproved: true }),
      pending: await Review.countDocuments({ isApproved: false }),
    };

    return NextResponse.json({
      success: true,
      data: reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Approve/Reject multiple reviews
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // Auth check
    const authErr = await checkAdmin(request);
    if (authErr) return authErr;

    const { reviewIds, action } = await request.json();

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Review IDs are required" },
        { status: 400 },
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use approve or reject" },
        { status: 400 },
      );
    }

    const updateData = {
      isApproved: action === "approve",
    };

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      updateData,
    );

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} reviews ${
        action === "approve" ? "approved" : "rejected"
      }`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete multiple reviews
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Auth check
    const authErr = await checkAdmin(request);
    if (authErr) return authErr;

    const { reviewIds } = await request.json();

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Review IDs are required" },
        { status: 400 },
      );
    }

    const result = await Review.deleteMany({
      _id: { $in: reviewIds },
    });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} reviews deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
