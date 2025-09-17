import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Joki from "@/models/Joki";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// GET - Fetch all joki services
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "true";

    const jokiServices = await Joki.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      message: "Joki services berhasil diambil",
      jokiServices,
    });
  } catch (error) {
    console.error("Error fetching joki services:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data joki services" },
      { status: 500 }
    );
  }
}

// POST - Create new joki service
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();

    const gameName = formData.get("gameName") as string;
    const caraPesan = JSON.parse(formData.get("caraPesan") as string);
    const features = JSON.parse(formData.get("features") as string);
    const requirements = JSON.parse(formData.get("requirements") as string);
    const items = JSON.parse(formData.get("items") as string);

    // Validate required fields
    if (!gameName || !caraPesan || !features || !requirements || !items) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Upload game image
    const gameImageFile = formData.get("gameImage") as File;
    let gameImageUrl: any = "";

    if (gameImageFile) {
      const uploadResult = await uploadToCloudinary(
        gameImageFile,
        "joki/games"
      );
      if (uploadResult.success) {
        gameImageUrl = uploadResult.url;
      } else {
        return NextResponse.json(
          { error: "Gagal upload gambar game" },
          { status: 500 }
        );
      }
    }

    // Process items with image uploads
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemImageFile = formData.get(`itemImage_${i}`) as File;

      let itemImageUrl = item.imgUrl || "";
      if (itemImageFile) {
        const uploadResult = await uploadToCloudinary(
          itemImageFile,
          "joki/items"
        );
        if (uploadResult.success) {
          itemImageUrl = uploadResult.url;
        } else {
          return NextResponse.json(
            { error: `Gagal upload gambar item ${item.itemName}` },
            { status: 500 }
          );
        }
      }

      processedItems.push({
        itemName: item.itemName,
        imgUrl: itemImageUrl,
        price: parseInt(item.price),
        description: item.description,
      });
    }

    // Create new joki service
    const newJoki = new Joki({
      gameName,
      imgUrl: gameImageUrl,
      caraPesan: caraPesan.filter((item: string) => item.trim()),
      features: features.filter((item: string) => item.trim()),
      requirements: requirements.filter((item: string) => item.trim()),
      item: processedItems,
    });

    await newJoki.save();

    return NextResponse.json(
      {
        message: "Joki service berhasil dibuat",
        joki: newJoki,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating joki service:", error);
    return NextResponse.json(
      { error: "Gagal membuat joki service" },
      { status: 500 }
    );
  }
}
