import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin, requireApiKey } from "@/lib/auth";
import PurchaseRun from "@/models/PurchaseRun";

/**
 * GET /api/robux-instant/purchase-runs
 * Ambil daftar log purchase_runs dengan filter & paginasi
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const username = searchParams.get("username");
    const invoiceId = searchParams.get("invoiceId");

    const query: any = {};
    if (status) query.status = status;
    if (username) {
      query.recipientUsername = { $regex: username.trim(), $options: "i" };
    }
    if (invoiceId) {
      query.invoiceId = { $regex: invoiceId.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [purchaseRuns, total] = await Promise.all([
      PurchaseRun.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PurchaseRun.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: purchaseRuns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[API purchase-runs] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal mengambil data purchase runs",
      },
      { status: 500 },
    );
  }
}
