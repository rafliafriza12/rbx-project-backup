import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Rbx5Stats from "@/models/Rbx5Stats";

// GET - Ambil konfigurasi stats (untuk admin panel)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const stats = await Rbx5Stats.getStats();

    return NextResponse.json({
      success: true,
      data: {
        mode: stats.mode,
        manualTotalStok: stats.manualTotalStok,
        manualTotalTerjual: stats.manualTotalTerjual,
        manualTotalCustomers: stats.manualTotalCustomers,
        trackedTotalTerjual: stats.trackedTotalTerjual,
        trackedTotalCustomers: stats.trackedTotalCustomers,
        updatedBy: stats.updatedBy,
        updatedAt: stats.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching Rbx5Stats config:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

// PUT - Update konfigurasi stats (admin set mode & manual values)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const stats = await Rbx5Stats.getStats();

    // Update mode jika diberikan
    if (body.mode && ["auto", "manual"].includes(body.mode)) {
      stats.mode = body.mode;
    }

    // Update manual values jika diberikan
    if (body.manualTotalStok !== undefined) {
      stats.manualTotalStok = Math.max(0, Number(body.manualTotalStok));
    }
    if (body.manualTotalTerjual !== undefined) {
      stats.manualTotalTerjual = Math.max(0, Number(body.manualTotalTerjual));
    }
    if (body.manualTotalCustomers !== undefined) {
      stats.manualTotalCustomers = Math.max(
        0,
        Number(body.manualTotalCustomers),
      );
    }

    // Update tracked values jika admin ingin reset/adjust
    if (body.trackedTotalTerjual !== undefined) {
      stats.trackedTotalTerjual = Math.max(0, Number(body.trackedTotalTerjual));
    }
    if (body.trackedTotalCustomers !== undefined) {
      stats.trackedTotalCustomers = Math.max(
        0,
        Number(body.trackedTotalCustomers),
      );
    }

    if (body.updatedBy) {
      stats.updatedBy = body.updatedBy;
    }

    await stats.save();

    return NextResponse.json({
      success: true,
      message: "Statistik berhasil diperbarui",
      data: {
        mode: stats.mode,
        manualTotalStok: stats.manualTotalStok,
        manualTotalTerjual: stats.manualTotalTerjual,
        manualTotalCustomers: stats.manualTotalCustomers,
        trackedTotalTerjual: stats.trackedTotalTerjual,
        trackedTotalCustomers: stats.trackedTotalCustomers,
        updatedBy: stats.updatedBy,
        updatedAt: stats.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating Rbx5Stats config:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
