import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Joki from "@/models/Joki";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Clear existing sample data
    await Joki.deleteMany({});

    const sampleJokiServices = [
      {
        gameName: "Blox Fruits",
        imgUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
        caraPesan: [
          "Berikan akun Roblox Anda (username & password)",
          "Pilih paket joki yang diinginkan",
          "Tunggu proses joki selesai (1-3 hari)",
          "Akun akan dikembalikan dengan progress sesuai pesanan",
          "Ganti password untuk keamanan",
        ],
        features: [
          "Professional player",
          "Fast completion",
          "Safe account handling",
          "Progress guarantee",
          "24/7 support",
        ],
        requirements: [
          "Akun Roblox level minimum 5",
          "Tidak ada ban history",
          "Akun harus bisa login",
          "Tidak sedang di-joki oleh orang lain",
        ],
        item: [
          {
            itemName: "Grinding to Level 2450",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 1500000,
            description:
              "Joki grinding dari level rendah sampai max level 2450 di Third Sea",
          },
          {
            itemName: "All Fruits Collection",
            imgUrl:
              "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=200&h=200&fit=crop",
            price: 2000000,
            description: "Mengumpulkan semua buah legendary dan mythical",
          },
          {
            itemName: "Complete Quest Line",
            imgUrl:
              "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200&h=200&fit=crop",
            price: 800000,
            description:
              "Menyelesaikan semua quest dari First Sea hingga Third Sea",
          },
        ],
      },
      {
        gameName: "Adopt Me",
        imgUrl:
          "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
        caraPesan: [
          "Login ke akun Roblox Anda",
          "Berikan akses akun untuk joki",
          "Pilih target yang ingin dicapai",
          "Tunggu proses joki selesai",
          "Akun dikembalikan dengan progress baru",
        ],
        features: [
          "Expert pet trading",
          "Safe trading methods",
          "Rare pet collection",
          "Money farming",
          "House decoration",
        ],
        requirements: [
          "Akun minimal 1 bulan",
          "Punya beberapa pet dasar",
          "Inventory tidak kosong",
          "Tidak ada restriction",
        ],
        item: [
          {
            itemName: "Mega Pet Making",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 1200000,
            description: "Joki pembuatan mega pet dari nol sampai mega neon",
          },
          {
            itemName: "Bucks Farming",
            imgUrl:
              "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=200&h=200&fit=crop",
            price: 500000,
            description: "Farming bucks sampai 50k untuk membeli pet eggs",
          },
          {
            itemName: "House Building",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 750000,
            description:
              "Membangun dan mendekorasi rumah dengan tema yang diinginkan",
          },
        ],
      },
      {
        gameName: "Murder Mystery 2",
        imgUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        caraPesan: [
          "Berikan detail akun Roblox",
          "Tentukan target weapon yang diinginkan",
          "Tunggu proses trading dan collecting",
          "Akun dikembalikan dengan weapon baru",
          "Verifikasi inventory setelah selesai",
        ],
        features: [
          "Godly weapon trading",
          "Rare knife collection",
          "Safe trading process",
          "Market expertise",
          "Value optimization",
        ],
        requirements: [
          "Akun dengan beberapa weapon",
          "Trading history yang baik",
          "Tidak ada trading ban",
          "Inventory space tersedia",
        ],
        item: [
          {
            itemName: "Godly Weapon Collection",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 2500000,
            description: "Joki untuk mendapatkan koleksi godly weapons lengkap",
          },
          {
            itemName: "Chroma Weapons Hunt",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 3000000,
            description: "Berburu dan mengkoleksi semua chroma weapons",
          },
          {
            itemName: "Ancient Weapons",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 1800000,
            description: "Mendapatkan ancient weapons yang sangat rare",
          },
        ],
      },
    ];

    const createdJokiServices = await Joki.insertMany(sampleJokiServices);

    return NextResponse.json(
      {
        message: "Sample joki services berhasil dibuat",
        count: createdJokiServices.length,
        jokiServices: createdJokiServices,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sample joki services:", error);
    return NextResponse.json(
      { error: "Gagal membuat sample data" },
      { status: 500 }
    );
  }
}
