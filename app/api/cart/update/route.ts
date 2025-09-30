import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart, { ICartItem } from "@/models/Cart";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemId, quantity } = body;

    if (!userId || !itemId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json(
        { error: "Keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item: ICartItem) => item._id?.toString() === itemId
    );
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update quantity and recalculate total amount
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalAmount =
      (cart.items[itemIndex].unitPrice || cart.items[itemIndex].price) *
      quantity;

    await cart.save();

    return NextResponse.json({ message: "Quantity berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui keranjang" },
      { status: 500 }
    );
  }
}
