import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Joki from "@/models/Joki";
import Transaction from "@/models/Transaction";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// GET - Fetch all joki services with order count
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "true";

    // Fetch all joki services
    const jokiServices = await Joki.find({}).sort({ createdAt: -1 }).lean();

    console.log("=== JOKI HOT BADGE DEBUG ===");
    console.log("Total Joki Services:", jokiServices.length);

    // First, let's check what transactions exist
    const allJokiTransactions = await Transaction.find({
      serviceType: "joki",
    })
      .select("serviceId serviceName status")
      .lean();

    console.log("\n=== ALL JOKI TRANSACTIONS ===");
    console.log("Total joki transactions:", allJokiTransactions.length);
    allJokiTransactions.forEach((t) => {
      console.log(`- serviceId: ${t.serviceId} (${typeof t.serviceId})`);
      console.log(`  serviceName: ${t.serviceName}`);
      console.log(`  status: ${t.status}`);
    });

    // Get order counts for each joki
    const jokiWithOrderCount = await Promise.all(
      jokiServices.map(async (joki) => {
        const jokiIdString = (joki as any)._id.toString();

        // Method 1: Direct match with joki._id (as ObjectId)
        const orderCountObjectId = await Transaction.countDocuments({
          serviceType: "joki",
          serviceId: joki._id,
          status: { $in: ["pending", "settlement", "capture"] },
        });

        // Method 2: Direct match with joki._id (as String)
        const orderCountString = await Transaction.countDocuments({
          serviceType: "joki",
          serviceId: jokiIdString,
          status: { $in: ["pending", "settlement", "capture"] },
        });

        // Method 3: Match by checking if serviceName contains joki.gameName
        // This handles case where serviceId might be item child ID
        const orderCountByName = await Transaction.countDocuments({
          serviceType: "joki",
          serviceName: { $regex: joki.gameName, $options: "i" },
          status: { $in: ["pending", "settlement", "capture"] },
        });

        // Get the maximum count from all methods
        const orderCount = Math.max(
          orderCountObjectId,
          orderCountString,
          orderCountByName
        );

        console.log(`\n=== ${joki.gameName} ===`);
        console.log(`  Joki ID: ${jokiIdString}`);
        console.log(`  Order Count (ObjectId): ${orderCountObjectId}`);
        console.log(`  Order Count (String): ${orderCountString}`);
        console.log(`  Order Count (By Name): ${orderCountByName}`);
        console.log(`  Final Order Count: ${orderCount}`);

        return {
          ...joki,
          orderCount,
        };
      })
    );

    // Sort by orderCount to determine top 3
    const sortedJoki = jokiWithOrderCount.sort(
      (a, b) => b.orderCount - a.orderCount
    );

    console.log("\n=== SORTED JOKI BY ORDER COUNT ===");
    sortedJoki.forEach((joki, index) => {
      console.log(
        `${index + 1}. ${(joki as any).gameName}: ${joki.orderCount} orders`
      );
    });

    // Mark top 3 as hot
    const jokiWithHotBadge = sortedJoki.map((joki, index) => {
      const isHot = index < 3 && joki.orderCount > 0;
      console.log(
        `${
          (joki as any).gameName
        }: isHot = ${isHot} (index: ${index}, orderCount: ${joki.orderCount})`
      );

      return {
        ...joki,
        isHot,
      };
    });

    console.log("\n=== HOT JOKI ===");
    jokiWithHotBadge
      .filter((j: any) => j.isHot)
      .forEach((j: any) => {
        console.log(`🔥 ${j.gameName} (${j.orderCount} orders)`);
      });

    return NextResponse.json({
      message: "Joki services berhasil diambil",
      jokiServices: jokiWithHotBadge,
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
    const developer = formData.get("developer") as string;

    // Parse with error handling
    let caraPesan, items;
    try {
      const caraPesanStr = formData.get("caraPesan") as string;
      const itemsStr = formData.get("items") as string;

      caraPesan = JSON.parse(caraPesanStr);
      items = JSON.parse(itemsStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON data in request" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!gameName || !developer || !caraPesan || !items) {
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
      developer,
      caraPesan: caraPesan.filter((item: string) => item.trim()),
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
