import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart, { ICartItem } from "@/models/Cart";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    await dbConnect();

    const userCart = await Cart.findOne({ userId });

    return NextResponse.json({
      items: userCart?.items || [],
      total:
        userCart?.items.reduce(
          (total: number, item: ICartItem) =>
            total +
            (item.totalAmount ||
              (item.unitPrice || item.price) * item.quantity),
          0
        ) || 0,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data keranjang" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("=== CART API POST DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));

    const {
      userId, // Pass userId directly from client
      // Primary fields (sesuai Transaction model)
      serviceType,
      serviceId,
      serviceName,
      serviceImage,
      serviceCategory,

      // Legacy fields
      type,
      gameId,
      gameName,
      itemName,
      imgUrl,

      // Pricing
      unitPrice,
      price,
      quantity = 1,
      totalAmount,

      description,

      // Service-specific fields
      gameType,
      robuxAmount,
      gamepassAmount,
      estimatedTime,
      additionalInfo,

      // Service details
      gamepass,
      jokiDetails,
      robuxInstantDetails,
      robloxUsername,
      robloxPassword,
      gamepassDetails,
    } = body;

    console.log("Extracted userId:", userId);

    if (!userId) {
      console.error("Missing userId");
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validation untuk field wajib
    const finalServiceType =
      serviceType ||
      (type === "rbx5" || type === "rbx-instant"
        ? "robux"
        : type === "gamepass"
        ? "gamepass"
        : type === "joki"
        ? "joki"
        : "robux");
    const finalServiceId = serviceId || gameId || itemName;
    const finalServiceName = serviceName || itemName;
    const finalServiceImage = serviceImage || imgUrl || ""; // Allow empty image
    const finalUnitPrice = unitPrice || price;

    // Extract gameName and itemName from service details if not provided at root level
    const finalGameName =
      gameName ||
      jokiDetails?.gameName ||
      gamepassDetails?.gameName ||
      serviceName || // Fallback to serviceName for robux services
      "Unknown Game";

    const finalItemName =
      itemName ||
      jokiDetails?.itemName ||
      gamepassDetails?.itemName ||
      serviceName || // Fallback to serviceName
      "Unknown Item";

    console.log("Validation check:", {
      finalServiceType,
      finalServiceId,
      finalServiceName,
      finalUnitPrice,
      finalGameName,
      finalItemName,
    });

    if (
      !finalServiceType ||
      !finalServiceId ||
      !finalServiceName ||
      !finalUnitPrice // Remove image from required validation
    ) {
      console.error("Validation failed - Data item tidak lengkap");
      return NextResponse.json(
        { error: "Data item tidak lengkap" },
        { status: 400 }
      );
    }

    const newItem: ICartItem = {
      // Primary fields
      serviceType: finalServiceType,
      serviceId: finalServiceId,
      serviceName: finalServiceName,
      serviceImage: finalServiceImage,
      serviceCategory,

      // Legacy fields
      type,
      gameId,
      gameName: finalGameName,
      itemName: finalItemName,
      imgUrl,

      // Pricing
      unitPrice: finalUnitPrice,
      price: finalUnitPrice,
      quantity,
      totalAmount: totalAmount || finalUnitPrice * quantity,

      description,

      // Service-specific fields
      gameType,
      robuxAmount,
      gamepassAmount,
      estimatedTime,
      additionalInfo,

      // Service details
      gamepass,
      jokiDetails,
      robuxInstantDetails,
      gamepassDetails,
      robloxUsername,
      robloxPassword,
    };

    console.log("Created newItem:", JSON.stringify(newItem, null, 2));

    // Check if cart exists
    const existingCart = await Cart.findOne({ userId });

    if (existingCart) {
      // ALWAYS add as new item - no duplicate detection/merging
      // Each add to cart creates a separate item
      existingCart.items.push(newItem);
      await existingCart.save();

      console.log("Added new item to cart:", {
        serviceName: finalServiceName,
        quantity: quantity,
      });
    } else {
      // Create new cart
      await Cart.create({
        userId,
        items: [newItem],
      });
    }

    return NextResponse.json({
      message: "Item berhasil ditambahkan ke keranjang",
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan item ke keranjang" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID diperlukan" },
        { status: 400 }
      );
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json(
        { error: "Keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item: ICartItem) => item._id?.toString() !== itemId
    );

    await cart.save();

    return NextResponse.json({
      message: "Item berhasil dihapus dari keranjang",
      items: cart.items,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item dari keranjang" },
      { status: 500 }
    );
  }
}
