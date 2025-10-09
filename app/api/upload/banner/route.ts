import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "File must be an image",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size must be less than 5MB",
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary using existing config
    const result = await uploadToCloudinary(file, "banners");

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to upload image",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id,
      },
    });
  } catch (error: any) {
    console.error("Error uploading banner image:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
