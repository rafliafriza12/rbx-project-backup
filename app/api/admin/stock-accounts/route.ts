import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";

export async function GET() {
  try {
    await connectDB();

    const stockAccounts = await StockAccount.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      stockAccounts,
    });
  } catch (error) {
    console.error("Error fetching stock accounts:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { robloxCookie } = await req.json();

    if (!robloxCookie) {
      return NextResponse.json(
        { success: false, message: "Cookie tidak ada" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate cookie by getting user info
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

    // Get Robux amount
    const robuxRes = await fetch(
      "https://economy.roblox.com/v1/user/currency",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      }
    );

    const robuxData = await robuxRes.json();

    // Check if account already exists
    const existingAccount = await StockAccount.findOne({ userId: user.id });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: "Akun sudah ada dalam database" },
        { status: 409 }
      );
    }

    // Create new stock account
    const stockAccount = new StockAccount({
      userId: user.id,
      username: user.name,
      displayName: user.displayName,
      robloxCookie,
      robux: robuxData.robux ?? 0,
      status: "active",
      lastChecked: new Date(),
    });

    await stockAccount.save();

    // Auto-purchase will be triggered manually after admin confirmation
    // (see: /app/api/admin/stock-accounts/trigger-auto-purchase/route.ts)

    return NextResponse.json({
      success: true,
      message: "Stock account berhasil ditambahkan",
      stockAccount,
    });
  } catch (error) {
    console.error("Error creating stock account:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
