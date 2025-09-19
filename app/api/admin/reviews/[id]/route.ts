import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

// PUT - Update single review status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { action } = await request.json();
    const { id } = await params;
    const reviewId = id;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use approve or reject" },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved: action === "approve" },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action === "approve" ? "approved" : "rejected"}`,
      data: review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete single review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const reviewId = id;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
