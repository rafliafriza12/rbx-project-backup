import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

// GET - Get all approved reviews
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("serviceType");
    const serviceCategory = searchParams.get("serviceCategory");
    const serviceId = searchParams.get("serviceId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = { isApproved: true };

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    if (serviceCategory) {
      filter.serviceCategory = serviceCategory;
    }

    if (serviceId) {
      filter.serviceId = serviceId;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new review
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      username,
      serviceType,
      serviceCategory,
      serviceId,
      serviceName,
      rating,
      comment,
    } = body;

    // Validasi input
    if (!username || !serviceType || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validasi rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validasi serviceCategory untuk robux
    if (serviceType === "robux" && !serviceCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Service category is required for robux type",
        },
        { status: 400 }
      );
    }

    // Validasi serviceId dan serviceName untuk joki dan gamepass
    if (
      (serviceType === "joki" || serviceType === "gamepass") &&
      (!serviceId || !serviceName)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Service ID and service name are required for joki and gamepass",
        },
        { status: 400 }
      );
    }

    const review = new Review({
      username,
      serviceType,
      serviceCategory,
      serviceId,
      serviceName,
      rating,
      comment,
      isApproved: false, // Default false, need admin approval
    });

    await review.save();

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully and waiting for approval",
        data: review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
