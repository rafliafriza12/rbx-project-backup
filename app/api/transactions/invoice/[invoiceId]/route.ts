import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    await dbConnect();

    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID diperlukan" },
        { status: 400 }
      );
    }

    // Cari transaksi berdasarkan invoiceId
    const transaction = await Transaction.findOne({
      invoiceId: invoiceId.toUpperCase(),
    }).exec();

    if (!transaction) {
      return NextResponse.json(
        {
          error: "Transaksi tidak ditemukan",
          message: "Pastikan kode invoice benar dan lengkap",
        },
        { status: 404 }
      );
    }

    // Transform data untuk frontend
    const transformedTransaction = {
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      // Discount fields
      discountPercentage: transaction.discountPercentage || 0,
      discountAmount: transaction.discountAmount || 0,
      finalAmount: transaction.finalAmount || transaction.totalAmount,
      robloxUsername: transaction.robloxUsername,
      robloxPassword: transaction.robloxPassword,
      jokiDetails: transaction.jokiDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      customerInfo: transaction.customerInfo || {},
      adminNotes: transaction.adminNotes || "",
      invoiceId: transaction.invoiceId,
      statusHistory: transaction.statusHistory.map((history: any) => ({
        status: history.status,
        updatedAt: history.timestamp || history.updatedAt,
        updatedBy: history.updatedBy || "system",
        notes: history.notes || "",
      })),
      expiresAt: transaction.expiresAt,
      midtransOrderId: transaction.midtransOrderId,
      snapToken: transaction.snapToken,
      redirectUrl: transaction.redirectUrl,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: transaction.paidAt,
      completedAt: transaction.completedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedTransaction,
      message: "Transaksi ditemukan",
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data transaksi",
        message: "Terjadi kesalahan server, coba lagi nanti",
      },
      { status: 500 }
    );
  }
}

// POST method untuk pencarian dengan body (opsional)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID diperlukan" },
        { status: 400 }
      );
    }

    // Cari transaksi berdasarkan invoiceId
    const transaction = await Transaction.findOne({
      invoiceId: invoiceId.toUpperCase(),
    }).exec();

    if (!transaction) {
      return NextResponse.json(
        {
          error: "Transaksi tidak ditemukan",
          message: "Pastikan kode invoice benar dan lengkap",
        },
        { status: 404 }
      );
    }

    // Transform data untuk frontend
    const transformedTransaction = {
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      // Discount fields
      discountPercentage: transaction.discountPercentage || 0,
      discountAmount: transaction.discountAmount || 0,
      finalAmount: transaction.finalAmount || transaction.totalAmount,
      robloxUsername: transaction.robloxUsername,
      robloxPassword: transaction.robloxPassword,
      jokiDetails: transaction.jokiDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      customerInfo: transaction.customerInfo || {},
      adminNotes: transaction.adminNotes || "",
      invoiceId: transaction.invoiceId,
      statusHistory: transaction.statusHistory.map((history: any) => ({
        status: history.status,
        updatedAt: history.timestamp || history.updatedAt,
        updatedBy: history.updatedBy || "system",
        notes: history.notes || "",
      })),
      expiresAt: transaction.expiresAt,
      midtransOrderId: transaction.midtransOrderId,
      snapToken: transaction.snapToken,
      redirectUrl: transaction.redirectUrl,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: transaction.paidAt,
      completedAt: transaction.completedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedTransaction,
      message: "Transaksi ditemukan",
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data transaksi",
        message: "Terjadi kesalahan server, coba lagi nanti",
      },
      { status: 500 }
    );
  }
}
