import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { requireAdmin, requireApiKey } from "@/lib/auth";
import { autoTransferInstantRobux } from "@/lib/robux-transfer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKeyError = requireApiKey(req);
  if (apiKeyError) return apiKeyError;

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

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (transaction.orderStatus === "completed") {
      return NextResponse.json(
        { success: false, message: "Transaksi ini sudah completed" },
        { status: 400 }
      );
    }

    // Tentukan aksi berdasarkan kategori layanan
    const isRobuxUsernameTransfer =
      transaction.serviceCategory === "robux_username" ||
      ((transaction.serviceType === "robux_instant" ||
        transaction.serviceCategory === "robux_instant") &&
        !transaction.robloxPassword);

    if (isRobuxUsernameTransfer) {
      console.log(`[Admin] 🚀 Retrying auto-transfer Robux via Username untuk Invoice: ${transaction.invoiceId}`);
      
      const transferResult = await autoTransferInstantRobux(transaction, {
        executedBy: "admin-retry",
      });

      return NextResponse.json({
        success: transferResult.success,
        message: transferResult.message,
        transaction: transferResult.transaction
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Fitur retry saat ini hanya didukung untuk Robux via Username" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error retrying transaction:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
