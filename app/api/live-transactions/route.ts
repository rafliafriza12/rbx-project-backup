import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await dbConnect();

    // Query 10 transaksi settlement terakhir
    const transactions = await Transaction.find({
      paymentStatus: "settlement",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(
      `[Live Transactions] Found ${transactions.length} transactions`
    );

    // Format data untuk ditampilkan
    const formattedTransactions = transactions.map((tx: any) => {
      // Mask username (ambil huruf pertama + bintang)
      const maskedUsername = tx.robloxUsername
        ? tx.robloxUsername.charAt(0) + "*******"
        : "u*******";

      // Tentukan nama service dan quantity
      let displayName = tx.serviceName || "Unknown Service";
      let displayQuantity = "";

      // Format berdasarkan service type
      if (tx.serviceType === "robux") {
        // Extract robux amount dari serviceName (format: "Robux 1000" atau "1000 Robux")
        const robuxMatch = displayName.match(/(\d+[\d,]*)\s*(?:R\$|Robux)/i);
        if (robuxMatch) {
          const amount = robuxMatch[1].replace(/,/g, "");
          displayQuantity = `${parseInt(amount).toLocaleString()} R$`;
        } else {
          displayQuantity = `${tx.quantity || 0} R$`;
        }
      } else if (tx.serviceType === "gamepass") {
        // Untuk gamepass, tampilkan nama game/item
        if (tx.gamepassDetails?.itemName) {
          displayName = tx.gamepassDetails.itemName;
          displayQuantity = "Gamepass";
        } else {
          displayQuantity = "Gamepass";
        }
      } else if (tx.serviceType === "joki") {
        displayQuantity = "Joki Service";
      }

      // Hitung waktu relatif
      const timeAgo = getTimeAgo(new Date(tx.createdAt));

      // Pilih warna/icon berdasarkan service type
      let colorScheme = "pink"; // default
      if (tx.serviceType === "gamepass") {
        colorScheme = "teal";
      } else if (tx.serviceType === "joki") {
        colorScheme = "indigo";
      } else if (tx.serviceType === "robux") {
        // Variasi warna untuk robux
        const colors = ["pink", "purple", "amber"];
        colorScheme = colors[Math.floor(Math.random() * colors.length)];
      }

      return {
        id: tx._id,
        username: maskedUsername,
        displayName,
        displayQuantity,
        timeAgo,
        serviceType: tx.serviceType,
        colorScheme,
      };
    });

    // Jika transaksi kurang dari 3, tambahkan data dummy untuk demo
    if (formattedTransactions.length < 3) {
      console.log(
        "[Live Transactions] Adding dummy data for better UX (found only " +
          formattedTransactions.length +
          " real transactions)"
      );

      const dummyTransactions = [
        {
          id: "dummy-1",
          username: "r*******",
          displayName: "Robux Package",
          displayQuantity: "1,000 R$",
          timeAgo: "5 menit lalu",
          serviceType: "robux",
          colorScheme: "pink",
        },
        {
          id: "dummy-2",
          username: "a*******",
          displayName: "Robux Package",
          displayQuantity: "2,500 R$",
          timeAgo: "15 menit lalu",
          serviceType: "robux",
          colorScheme: "purple",
        },
        {
          id: "dummy-3",
          username: "m*******",
          displayName: "Robux Package",
          displayQuantity: "800 R$",
          timeAgo: "1 jam lalu",
          serviceType: "robux",
          colorScheme: "amber",
        },
        {
          id: "dummy-4",
          username: "d*******",
          displayName: "Gamepass VIP",
          displayQuantity: "Gamepass",
          timeAgo: "2 jam lalu",
          serviceType: "gamepass",
          colorScheme: "teal",
        },
        {
          id: "dummy-5",
          username: "s*******",
          displayName: "Robux Package",
          displayQuantity: "1,500 R$",
          timeAgo: "3 jam lalu",
          serviceType: "robux",
          colorScheme: "purple",
        },
        {
          id: "dummy-6",
          username: "b*******",
          displayName: "Robux Package",
          displayQuantity: "3,200 R$",
          timeAgo: "4 jam lalu",
          serviceType: "robux",
          colorScheme: "amber",
        },
        {
          id: "dummy-7",
          username: "l*******",
          displayName: "Joki Service",
          displayQuantity: "Joki Service",
          timeAgo: "5 jam lalu",
          serviceType: "joki",
          colorScheme: "indigo",
        },
      ];

      // Gabungkan real transactions dengan dummy
      const combined = [
        ...formattedTransactions,
        ...dummyTransactions.slice(0, 7 - formattedTransactions.length),
      ];

      return NextResponse.json({
        success: true,
        data: combined,
        note: "Includes sample data for demonstration",
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
    });
  } catch (error: any) {
    console.error("Error fetching live transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data transaksi",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function untuk format waktu relatif
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return "Baru saja";
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} hari lalu`;
}
