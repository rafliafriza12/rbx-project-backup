import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Joki from "@/models/Joki";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// GET - Fetch single joki service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const joki = await Joki.findById(params.id);

    if (!joki) {
      return NextResponse.json(
        { error: "Joki service tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Joki service berhasil diambil",
      joki,
    });
  } catch (error) {
    console.error("Error fetching joki service:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data joki service" },
      { status: 500 }
    );
  }
}

// PUT - Update joki service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const existingJoki = await Joki.findById(params.id);
    if (!existingJoki) {
      return NextResponse.json(
        { error: "Joki service tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const gameName = formData.get("gameName") as string;

    // Parse with error handling
    let caraPesan, features, items;
    try {
      const caraPesanStr = formData.get("caraPesan") as string;
      const featuresStr = formData.get("features") as string;
      const itemsStr = formData.get("items") as string;

      console.log("Parsing caraPesan:", caraPesanStr);
      console.log("Parsing features:", featuresStr);
      console.log("Parsing items:", itemsStr);

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

    // Handle game image update
    let gameImageUrl = existingJoki.imgUrl;
    const gameImageFile = formData.get("gameImage") as File;

    if (gameImageFile && gameImageFile.size > 0) {
      // Delete old image if exists
      if (existingJoki.imgUrl) {
        const oldPublicId = existingJoki.imgUrl.split("/").pop()?.split(".")[0];
        if (oldPublicId) {
          await deleteFromCloudinary(`joki/games/${oldPublicId}`);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(
        gameImageFile,
        "joki/games"
      );
      if (uploadResult.success) {
        gameImageUrl = uploadResult.url;
      }
    }

    // Process items with image updates
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemImageFile = formData.get(`itemImage_${i}`) as File;

      let itemImageUrl = item.imgUrl || "";

      if (itemImageFile && itemImageFile.size > 0) {
        // Delete old image if it's being replaced
        if (item.imgUrl) {
          const oldPublicId = item.imgUrl.split("/").pop()?.split(".")[0];
          if (oldPublicId) {
            await deleteFromCloudinary(`joki/items/${oldPublicId}`);
          }
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(
          itemImageFile,
          "joki/items"
        );
        if (uploadResult.success) {
          itemImageUrl = uploadResult.url;
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

    // Update joki service
    const updatedJoki = await Joki.findByIdAndUpdate(
      params.id,
      {
        gameName,
        imgUrl: gameImageUrl,
        caraPesan: caraPesan.filter((item: string) => item.trim()),
        features: features.filter((item: string) => item.trim()),
        item: processedItems,
      },
      { new: true }
    );

    if (!updatedJoki) {
      return NextResponse.json(
        { error: "Gagal mengupdate joki service" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Joki service berhasil diupdate",
      joki: updatedJoki,
    });
  } catch (error: any) {
    console.error("Error updating joki service:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengupdate joki service" },
      { status: 500 }
    );
  }
}

// DELETE - Delete joki service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const joki = await Joki.findById(params.id);

    if (!joki) {
      return NextResponse.json(
        { error: "Joki service tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete images from Cloudinary
    if (joki.imgUrl) {
      const publicId = joki.imgUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        await deleteFromCloudinary(`joki/games/${publicId}`);
      }
    }

    // Delete item images
    for (const item of joki.item) {
      if (item.imgUrl) {
        const publicId = item.imgUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await deleteFromCloudinary(`joki/items/${publicId}`);
        }
      }
    }

    await Joki.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: "Joki service berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting joki service:", error);
    return NextResponse.json(
      { error: "Gagal menghapus joki service" },
      { status: 500 }
    );
  }
}
