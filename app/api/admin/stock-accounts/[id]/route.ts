import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import { autoPurchasePendingRobux } from "@/lib/auto-purchase-robux";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { robloxCookie } = await req.json();

    if (!robloxCookie) {
      return NextResponse.json(
        { success: false, message: "Cookie tidak ada" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate cookie and get updated user info
    const userRes = await fetch(
      "https://users.roblox.com/v1/users/authenticated",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, message: "Cookie invalid / expired" },
        { status: 401 }
      );
    }

    const user = await userRes.json();

    // Get updated Robux amount
    const robuxRes = await fetch(
      "https://economy.roblox.com/v1/user/currency",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      }
    );

    const robuxData = await robuxRes.json();

    // Update the stock account
    const updatedAccount = await StockAccount.findByIdAndUpdate(
      id,
      {
        userId: user.id,
        username: user.name,
        displayName: user.displayName,
        robloxCookie,
        robux: robuxData.robux ?? 0,
        lastChecked: new Date(),
      },
      { new: true }
    );

    if (!updatedAccount) {
      return NextResponse.json(
        { success: false, message: "Stock account tidak ditemukan" },
        { status: 404 }
      );
    }

    // Start auto-purchase in background (non-blocking)
    // Will check ALL active stock accounts, not just this one
    // console.log("🚀 Triggering auto-purchase for pending transactions...");
    // const autoPurchaseResult = await autoPurchasePendingRobux(
    //   updatedAccount._id.toString()
    // );

    return NextResponse.json({
      success: true,
      message:
        "Stock account berhasil diperbarui. Auto-purchase dimulai untuk transaksi pending.",
      stockAccount: updatedAccount,
      // autoPurchase: {
      //   sessionId: autoPurchaseResult.sessionId,
      //   message: autoPurchaseResult.message,
      // },
    });
  } catch (error) {
    console.error("Error updating stock account:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const deletedAccount = await StockAccount.findByIdAndDelete(id);

    if (!deletedAccount) {
      return NextResponse.json(
        { success: false, message: "Stock account tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stock account berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting stock account:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
