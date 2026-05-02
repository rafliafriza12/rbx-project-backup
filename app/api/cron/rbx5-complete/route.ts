import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Basic security using a secret token if needed
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, require it (Bearer token)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 5 Days in milliseconds
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    const now = new Date();

    // Temukan semua transaksi RBX5 yang orderStatus = processing
    const transactions = await Transaction.find({
      serviceCategory: "robux_5_hari",
      orderStatus: "processing"
    });

    let completedCount = 0;
    const completedInvoices = [];

    for (const tx of transactions) {
      // Cari kapan status berubah menjadi "processing" dari statusHistory
      // Kita cari entri terakhir yang mengubah status ke order:processing
      const processingEntries = tx.statusHistory.filter(
        (h: any) => h.status === "order:processing" || (h.status === "order" && h.notes?.includes("Robux sedang dikirim"))
      );
      
      let processingDate = null;
      if (processingEntries.length > 0) {
        // Ambil yang paling baru (terakhir)
        const lastEntry = processingEntries[processingEntries.length - 1];
        processingDate = lastEntry.timestamp || lastEntry.updatedAt;
      } else {
        // Fallback jika tidak ada di history (seharusnya ada)
        processingDate = tx.updatedAt;
      }

      if (!processingDate) continue;

      const timeElapsed = now.getTime() - new Date(processingDate).getTime();
      
      // Jika sudah melewati 5 hari
      if (timeElapsed >= FIVE_DAYS_MS) {
        // Panggil fungsi updateStatus
        await tx.updateStatus(
          "order",
          "completed",
          "Robux telah berhasil dikirim (Otomatis 5 Hari)",
          "system-cron"
        );
        
        // Update user spendedMoney jika transaksi ini memiliki userId dan belum pernah diupdate
        // Note: Biasanya spendedMoney diupdate saat payment settlement, tapi ini untuk safety
        // (Logika spendedMoney di-handle di admin update, tapi di sini via cron mungkin tidak perlu
        // karena payment sudah settlement di awal. Jadi kita lewati update spendedMoney)
        
        completedCount++;
        completedInvoices.push(tx.invoiceId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${transactions.length} processing RBX5 orders. Auto-completed ${completedCount} orders.`,
      completedInvoices
    });

  } catch (error: any) {
    console.error("Cron Error RBX5 Auto Complete:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
