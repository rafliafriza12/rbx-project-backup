import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import { autoPurchasePendingRobux } from "@/lib/auto-purchase-robux";
import { requireAdmin } from "@/lib/auth";

/**
 * Fetch with retry & timeout - handles Roblox socket errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return res;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(
        `⚠️ Fetch attempt ${attempt}/${maxRetries} failed for ${url}: ${errMsg}`,
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry: 2s, 4s, 6s
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Allow admin OR internal server calls (from webhooks)
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    const isInternalCall = expectedSecret && internalSecret === expectedSecret;

    if (!isInternalCall) {
      try {
        await requireAdmin(req);
      } catch (authError: any) {
        const status = authError.message.includes("Forbidden") ? 403 : 401;
        return NextResponse.json({ error: authError.message }, { status });
      }
    }

    const { id } = await params;
    const { robloxCookie } = await req.json();

    if (!robloxCookie) {
      return NextResponse.json(
        { success: false, message: "Cookie tidak ada" },
        { status: 400 },
      );
    }

    await connectDB();

    // Validate cookie and get updated user info
    const userRes = await fetchWithRetry(
      "https://users.roblox.com/v1/users/authenticated",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      },
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, message: "Cookie invalid / expired" },
        { status: 401 },
      );
    }

    const user = await userRes.json();

    // Get updated Robux amount
    const robuxRes = await fetchWithRetry(
      "https://economy.roblox.com/v1/user/currency",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      },
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
      { new: true },
    );

    if (!updatedAccount) {
      return NextResponse.json(
        { success: false, message: "Stock account tidak ditemukan" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth check - hanya admin
    try {
      await requireAdmin(req);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const { id } = await params;
    await connectDB();

    const deletedAccount = await StockAccount.findByIdAndDelete(id);

    if (!deletedAccount) {
      return NextResponse.json(
        { success: false, message: "Stock account tidak ditemukan" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}
