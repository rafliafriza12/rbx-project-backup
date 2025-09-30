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
    const count =
      userCart?.items.reduce(
        (total: number, item: ICartItem) => total + item.quantity,
        0
      ) || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return NextResponse.json({ count: 0 });
  }
}
