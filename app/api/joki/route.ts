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

    // Parse with error handling
    let caraPesan, features, items;
    try {
      const caraPesanStr = formData.get("caraPesan") as string;
      const featuresStr = formData.get("features") as string;
      const itemsStr = formData.get("items") as string;

      caraPesan = JSON.parse(caraPesanStr);
      features = JSON.parse(featuresStr);
      items = JSON.parse(itemsStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON data in request" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!gameName || !caraPesan || !features || !items) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Upload game image
    const gameImageFile = formData.get("gameImage") as File;
    let gameImageUrl: any = "";

    if (gameImageFile && gameImageFile.size > 0) {
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
      if (itemImageFile && itemImageFile.size > 0) {
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
        price: parseInt(item.price) || 0,
        description: item.description || "",
        syaratJoki: Array.isArray(item.syaratJoki) ? item.syaratJoki : [],
        prosesJoki: Array.isArray(item.prosesJoki) ? item.prosesJoki : [],
      });
    }

    // Create new joki service
    const newJoki = new Joki({
      gameName,
      imgUrl: gameImageUrl,
      caraPesan: caraPesan.filter((item: string) => item.trim()),
      features: features.filter((item: string) => item.trim()),
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
  } catch (error: any) {
    console.error("Error creating joki service:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat joki service" },
      { status: 500 }
    );
  }
}
