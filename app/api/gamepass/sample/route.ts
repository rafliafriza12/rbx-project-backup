import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Delete all existing gamepasses
    await Gamepass.deleteMany({});

    // Sample gamepass data
    const sampleGamepasses = [
      {
        gameName: "Blox Fruits",
        imgUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
        caraPesan: [
          "Login ke akun Roblox Anda",
          "Join game Blox Fruits",
          "Berikan username Roblox kepada admin",
          "Tunggu proses pengiriman item",
          "Item akan masuk ke inventory dalam 5-10 menit",
        ],
        features: [
          "Instant delivery",
          "100% safe and secure",
          "24/7 customer support",
          "Money back guarantee",
          "Original items only",
        ],
        item: [
          {
            itemName: "Dragon Fruit",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 500000,
          },
          {
            itemName: "Leopard Fruit",
            imgUrl:
              "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=200&h=200&fit=crop",
            price: 750000,
          },
          {
            itemName: "Buddha Fruit",
            imgUrl:
              "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200&h=200&fit=crop",
            price: 300000,
          },
        ],
      },
      {
        gameName: "Adopt Me",
        imgUrl:
          "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
        caraPesan: [
          "Login ke akun Roblox Anda",
          "Join game Adopt Me",
          "Add admin sebagai friend di Roblox",
          "Meet di game untuk trade",
          "Terima pet yang sudah dibeli",
        ],
        features: [
          "Verified pets",
          "Safe trading process",
          "Experienced traders",
          "Quick delivery",
          "Rare pets available",
        ],
        item: [
          {
            itemName: "Mega Neon Dragon",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 850000,
          },
          {
            itemName: "Neon Unicorn",
            imgUrl:
              "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=200&h=200&fit=crop",
            price: 400000,
          },
          {
            itemName: "Shadow Dragon",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 1200000,
          },
        ],
      },
      {
        gameName: "Murder Mystery 2",
        imgUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        caraPesan: [
          "Login ke akun Roblox Anda",
          "Join game Murder Mystery 2",
          "Berikan username kepada admin",
          "Admin akan mengirim item via trade",
          "Accept trade request untuk menerima item",
        ],
        features: [
          "Godly weapons available",
          "Rare knives and guns",
          "Instant trading",
          "Secure transactions",
          "Best prices guaranteed",
        ],
        item: [
          {
            itemName: "Chroma Lightbringer",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 650000,
          },
          {
            itemName: "Chroma Darkbringer",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 680000,
          },
          {
            itemName: "Eternal III",
            imgUrl:
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
            price: 450000,
          },
        ],
      },
    ];

    // Insert sample data
    const insertedGamepasses = await Gamepass.insertMany(sampleGamepasses);

    return NextResponse.json(
      {
        message: "Sample gamepass data berhasil dibuat",
        count: insertedGamepasses.length,
        gamepasses: insertedGamepasses,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create sample gamepass error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
