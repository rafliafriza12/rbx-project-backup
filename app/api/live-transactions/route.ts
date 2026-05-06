import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import RobloxCache from "@/models/RobloxCache";

export async function GET(request: NextRequest) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    // Query 10 transaksi settlement terakhir
    const transactions = await Transaction.find({
      paymentStatus: "settlement",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customerInfo.userId", "profilePicture firstName lastName username")
      .lean();

    console.log(
      `[Live Transactions] Found ${transactions.length} transactions`,
    );

    // Format data untuk ditampilkan
    const formattedTransactions = await Promise.all(transactions.map(async (tx: any) => {
      // Prioritaskan robloxUsername, abaikan username Google
      const actualUsername = tx.robloxUsername || "Roblox Player";
      
      let profilePicture = null;
      
      // Jika punya robloxUsername, coba cari avatar di cache
      if (tx.robloxUsername) {
        try {
          const cached = await RobloxCache.findOne({ username: tx.robloxUsername.toLowerCase() }).lean();
          if (cached && cached.avatarUrl) {
            profilePicture = cached.avatarUrl;
          } else {
            // Fetch dari Roblox API jika tidak ada di cache
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usernames: [tx.robloxUsername.toLowerCase()],
                excludeBannedUsers: false,
              }),
            });
            
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData.data && userData.data.length > 0) {
                const user = userData.data[0];
                const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`);
                
                if (avatarRes.ok) {
                  const avatarData = await avatarRes.json();
                  const avatarUrl = avatarData.data?.[0]?.imageUrl ?? "";
                  
                  if (avatarUrl) {
                    profilePicture = avatarUrl;
                    // Simpan ke cache untuk request berikutnya
                    RobloxCache.findOneAndUpdate(
                      { username: tx.robloxUsername.toLowerCase() },
                      {
                        username: user.name.toLowerCase(),
                        userId: user.id,
                        displayName: user.displayName,
                        avatarUrl,
                        updatedAt: new Date(),
                      },
                      { new: true, upsert: true }
                    ).catch(e => console.error("Cache update error:", e));
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error fetching roblox cache:", e);
        }
      }
      
      // Jika tidak ada di cache, gunakan dummy avatar berdasarkan nama, bukan foto google
      if (!profilePicture) {
        profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${actualUsername}`;
      }
      
      const maskedUsername = actualUsername;

      // Tentukan nama service dan quantity
      let displayName = tx.serviceName || "Unknown Service";
      let displayQuantity = "";

      // Format berdasarkan service type
      if (tx.serviceType === "robux") {
        // Tampilkan nama produk (contoh: Robux 5 Hari, Robux Instan)
        if (tx.serviceCategory === "robux_5_hari") {
          displayQuantity = "RBX 5 Hari";
        } else if (tx.serviceCategory === "robux_instan" || tx.serviceCategory === "robux_instant") {
          displayQuantity = "RBX Instant";
        } else {
          displayQuantity = tx.serviceName || "RBX";
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
        profilePicture,
      };
    }));

    // Jika transaksi kurang dari 3, tambahkan data dummy untuk demo
    if (formattedTransactions.length < 3) {
      console.log(
        "[Live Transactions] Adding dummy data for better UX (found only " +
          formattedTransactions.length +
          " real transactions)",
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
          profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=dummy1",
        },
        {
          id: "dummy-2",
          username: "a*******",
          displayName: "Robux Package",
          displayQuantity: "2,500 R$",
          timeAgo: "15 menit lalu",
          serviceType: "robux",
          colorScheme: "purple",
          profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=dummy2",
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
      { status: 500 },
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
