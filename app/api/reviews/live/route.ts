import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    // Query 10 reviews terakhir yang sudah diapprove
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`[Live Reviews] Found ${reviews.length} approved reviews`);

    // Format data untuk ditampilkan
    const formattedReviews = await Promise.all(reviews.map(async (review: any) => {
      // Mask username (ambil huruf pertama + bintang)
      const maskUsername = (name: string) => {
        if (!name) return "U*****";
        if (name.length <= 4) return name.charAt(0) + "***" + (name.length > 1 ? name.charAt(name.length - 1) : "");
        return name.slice(0, 2) + "***" + name.slice(-2);
      };
      
      const maskedUsername = maskUsername(review.username);

      // Initial untuk avatar (huruf pertama username)
      const initial = review.username
        ? review.username.charAt(0).toUpperCase()
        : "A";

      // Format service info
      let serviceInfo = "";
      if (review.serviceType === "robux") {
        if (review.serviceCategory === "robux_5_hari") {
          serviceInfo = "Robux 5 Hari";
        } else if (review.serviceCategory === "robux_instant") {
          serviceInfo = "Robux Instant";
        } else {
          serviceInfo = "Robux";
        }
      } else if (review.serviceType === "gamepass") {
        serviceInfo = review.serviceName || "Gamepass";
      } else if (review.serviceType === "joki") {
        serviceInfo = review.serviceName || "Joki Service";
      }

      // Ambil serviceImage dari Review (baru ditambahkan), fallback ke lookup Transaction untuk review lama
      let serviceImage = review.serviceImage || null;
      if (!serviceImage && review.transactionId) {
        try {
          const Transaction = (await import("@/models/Transaction")).default;
          const tx = await Transaction.findById(review.transactionId).select("serviceImage").lean();
          if (tx && tx.serviceImage) {
            serviceImage = tx.serviceImage;
          }
        } catch (e) {
          console.error("Error fetching transaction image for review:", e);
        }
      }

      // Hitung waktu relatif
      const timeAgo = getTimeAgo(new Date(review.createdAt));

      // Pilih warna berdasarkan service type
      let colorScheme = "pink";
      if (review.serviceType === "gamepass") {
        colorScheme = "teal";
      } else if (review.serviceType === "joki") {
        colorScheme = "indigo";
      } else if (review.serviceType === "robux") {
        const colors = ["pink", "purple", "amber"];
        colorScheme = colors[Math.floor(Math.random() * colors.length)];
      }

      // Tentukan gambar produk fallback jika tidak ada dari Transaction
      let finalServiceImage = serviceImage;
      if (!finalServiceImage) {
        if (review.serviceType === "robux") {
          finalServiceImage = (review.serviceCategory === "robux_instant" || review.serviceCategory === "robux_instan")
            ? "/icon/roblox-premium-pink.png"
            : "/icon/icons8-robux-48 (2).png";
        } else if (review.serviceType === "gamepass") {
          finalServiceImage = "/icon/gamepass-gift.webp";
        }
      }

      return {
        id: review._id,
        username: maskedUsername,
        initial,
        rating: review.rating,
        comment: review.comment,
        serviceInfo,
        timeAgo,
        serviceType: review.serviceType,
        colorScheme,
        serviceImage: finalServiceImage,
      };
    }));

    // Jika review kurang dari 3, tambahkan data dummy
    if (formattedReviews.length < 3) {
      console.log(
        "[Live Reviews] Adding dummy data for better UX (found only " +
          formattedReviews.length +
          " real reviews)",
      );

      const dummyReviews = [
        {
          id: "dummy-1",
          username: "R*****",
          initial: "R",
          rating: 5,
          comment: "Pelayanannya cepet banget! Robux langsung masuk.",
          serviceInfo: "Robux 5 Hari",
          timeAgo: "2 hari lalu",
          serviceType: "robux",
          colorScheme: "pink",
          serviceImage: "/icon/icons8-robux-48 (2).png",
        },
        {
          id: "dummy-2",
          username: "A*****",
          initial: "A",
          rating: 5,
          comment: "Harga paling murah dan amanah! Recommended!",
          serviceInfo: "Robux 5 Hari",
          timeAgo: "3 hari lalu",
          serviceType: "robux",
          colorScheme: "purple",
          serviceImage: "/icon/icons8-robux-48 (2).png",
        },
        {
          id: "dummy-3",
          username: "M*****",
          initial: "M",
          rating: 5,
          comment: "CS nya ramah banget, dibantu sampe tuntas.",
          serviceInfo: "Robux 5 Hari",
          timeAgo: "4 hari lalu",
          serviceType: "robux",
          colorScheme: "pink",
          serviceImage: "/icon/icons8-robux-48 (2).png",
        },
        {
          id: "dummy-4",
          username: "D*****",
          initial: "D",
          rating: 5,
          comment: "Gamepass langsung aktif sesuai jadwal. Mantap!",
          serviceInfo: "Gamepass",
          timeAgo: "5 hari lalu",
          serviceType: "gamepass",
          colorScheme: "teal",
          serviceImage: "/icon/gamepass-gift.webp",
        },
        {
          id: "dummy-5",
          username: "S*****",
          initial: "S",
          rating: 5,
          comment: "Pertama kali beli disini, ternyata legit!",
          serviceInfo: "Robux 5 Hari",
          timeAgo: "1 minggu lalu",
          serviceType: "robux",
          colorScheme: "amber",
          serviceImage: "/icon/icons8-robux-48 (2).png",
        },
        {
          id: "dummy-6",
          username: "B*****",
          initial: "B",
          rating: 5,
          comment: "Website keren, sistemnya juga aman. Top!",
          serviceInfo: "Robux Instant",
          timeAgo: "1 minggu lalu",
          serviceType: "robux",
          colorScheme: "purple",
          serviceImage: "/icon/roblox-premium-pink.png",
        },
      ];

      // Gabungkan real reviews dengan dummy
      const combined = [
        ...formattedReviews,
        ...dummyReviews.slice(0, 6 - formattedReviews.length),
      ];

      return NextResponse.json({
        success: true,
        data: combined,
        note: "Includes sample reviews for demonstration",
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedReviews,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data review",
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
  if (diffInDays === 1) return "1 hari lalu";
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return "1 minggu lalu";
  if (diffInWeeks < 4) return `${diffInWeeks} minggu lalu`;

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} bulan lalu`;
}
