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
    } = body;

    if (!userId) {
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
    const finalServiceImage = serviceImage || imgUrl;
    const finalUnitPrice = unitPrice || price;

    if (
      !finalServiceType ||
      !finalServiceId ||
      !finalServiceName ||
      !finalServiceImage ||
      !finalUnitPrice
    ) {
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
      gameName,
      itemName,
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
    };

    // Check if cart exists
    const existingCart = await Cart.findOne({ userId });

    if (existingCart) {
      // Check if item already exists in cart
      const itemIndex = existingCart.items.findIndex(
        (item: ICartItem) =>
          item.serviceId === finalServiceId &&
          item.serviceType === finalServiceType
      );

      if (itemIndex > -1) {
        // Update quantity if item exists
        existingCart.items[itemIndex].quantity += quantity;
        existingCart.items[itemIndex].totalAmount =
          (existingCart.items[itemIndex].unitPrice ||
            existingCart.items[itemIndex].price) *
          existingCart.items[itemIndex].quantity;
        await existingCart.save();
      } else {
        // Add new item
        existingCart.items.push(newItem);
        await existingCart.save();
      }
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
