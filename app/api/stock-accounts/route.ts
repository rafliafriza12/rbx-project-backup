import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, inactive, atau all
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    } else if (!includeInactive) {
      query.status = "active"; // Default hanya active
    }

    // Get stock accounts
    const stockAccounts = await StockAccount.find(query)
      .select("-robloxCookie") // Exclude sensitive cookie data
      .sort({ robux: -1, lastChecked: -1 });

    // Calculate statistics
    const totalAccounts = stockAccounts.length;
    const activeAccounts = stockAccounts.filter(
      (acc) => acc.status === "active"
    ).length;
    const inactiveAccounts = stockAccounts.filter(
      (acc) => acc.status === "inactive"
    ).length;
    const totalRobux = stockAccounts
      .filter((acc) => acc.status === "active")
      .reduce((sum, acc) => sum + acc.robux, 0);

    const stats = {
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      totalRobux,
      averageRobuxPerAccount:
        activeAccounts > 0 ? Math.round(totalRobux / activeAccounts) : 0,
    };

    return NextResponse.json({
      success: true,
      data: stockAccounts,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stock accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stock accounts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
