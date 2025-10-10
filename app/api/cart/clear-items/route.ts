import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";

/**
 * POST - Clear multiple items from cart after successful checkout
 * This endpoint is called after checkout to remove purchased items from cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemIds } = body;

    console.log("=== CLEAR CART ITEMS DEBUG ===");
    console.log("User ID:", userId);
    console.log("Item IDs to remove:", itemIds);

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Item IDs array diperlukan dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      console.log("Cart not found for user:", userId);
      return NextResponse.json(
        { error: "Keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    const initialItemCount = cart.items.length;

    // Remove all items that match the provided IDs
    cart.items = cart.items.filter((item: any) => {
      const itemIdString = item._id?.toString();
      const shouldRemove = itemIds.includes(itemIdString);

      if (shouldRemove) {
        console.log("Removing item:", {
          id: itemIdString,
          serviceName: item.serviceName,
        });
      }

      return !shouldRemove;
    });

    const removedCount = initialItemCount - cart.items.length;

    // Save updated cart
    await cart.save();

    console.log("=== CLEAR CART RESULT ===");
    console.log("Items removed:", removedCount);
    console.log("Items remaining:", cart.items.length);

    return NextResponse.json({
      success: true,
      message: `${removedCount} item berhasil dihapus dari keranjang`,
      removedCount,
      remainingCount: cart.items.length,
      remainingItems: cart.items,
    });
  } catch (error) {
    console.error("Error clearing cart items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus item dari keranjang",
      },
      { status: 500 }
    );
  }
}
