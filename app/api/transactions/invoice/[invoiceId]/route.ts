import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { maskEmail, maskPhone, maskUsername, maskName } from "@/lib/mask";
import { requireApiKey } from "@/lib/auth";

/**
 * Transform transaction to safe public response.
 * NEVER expose: robloxPassword, snapToken, redirectUrl, midtransOrderId, adminNotes,
 * paymentMethodId, jokiDetails credentials, customerInfo.userId, statusHistory.updatedBy
 */
function toSafeTransaction(transaction: any) {
  return {
    _id: transaction._id.toString(),
    serviceType: transaction.serviceType,
    serviceId: transaction.serviceId.toString(),
    serviceName: transaction.serviceName,
    serviceImage: transaction.serviceImage || "",
    serviceCategory: transaction.serviceCategory,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    totalAmount: transaction.totalAmount,
    discountPercentage: transaction.discountPercentage || 0,
    discountAmount: transaction.discountAmount || 0,
    finalAmount: transaction.finalAmount || transaction.totalAmount,
    robloxUsername: maskUsername(transaction.robloxUsername),
    // REMOVED: robloxPassword, jokiDetails, robuxInstantDetails, rbx5Details
    // gamepass: transaction.gamepass || {},
    gamepassDetails: transaction.gamepassDetails || {},
    paymentStatus: transaction.paymentStatus,
    orderStatus: transaction.orderStatus,
    paymentMethodName: transaction.paymentMethodName || null,
    paymentFee: transaction.paymentFee || 0,
    customerInfo: {
      name: maskName(transaction.customerInfo?.name || ""),
      email: maskEmail(transaction.customerInfo?.email || ""),
    },
    invoiceId: transaction.invoiceId,
    statusHistory: (transaction.statusHistory || []).map((history: any) => ({
      status: history.status,
      updatedAt: history.timestamp || history.updatedAt,
      notes: history.notes || "",
    })),
    expiresAt: transaction.expiresAt,
    // REMOVED: midtransOrderId, snapToken, redirectUrl, adminNotes
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    paidAt: transaction.paidAt,
    completedAt: transaction.completedAt,
  };
}

function toSafeRelatedTransaction(t: any) {
  return {
    _id: t._id.toString(),
    serviceType: t.serviceType,
    serviceId: t.serviceId.toString(),
    serviceName: t.serviceName,
    serviceImage: t.serviceImage || "",
    serviceCategory: t.serviceCategory,
    quantity: t.quantity,
    unitPrice: t.unitPrice,
    totalAmount: t.totalAmount,
    discountPercentage: t.discountPercentage || 0,
    discountAmount: t.discountAmount || 0,
    finalAmount: t.finalAmount || t.totalAmount,
    robloxUsername: maskUsername(t.robloxUsername),
    orderStatus: t.orderStatus,
    invoiceId: t.invoiceId,
    createdAt: t.createdAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID diperlukan" },
        { status: 400 },
      );
    }

    // Cari transaksi berdasarkan invoiceId ATAU midtransOrderId (for post-payment redirect)
    const transaction = await Transaction.findOne({
      $or: [
        { invoiceId: invoiceId.toUpperCase() },
        { midtransOrderId: invoiceId },
      ],
    }).exec();

    if (!transaction) {
      return NextResponse.json(
        {
          error: "Transaksi tidak ditemukan",
          message: "Pastikan kode invoice benar dan lengkap",
        },
        { status: 404 },
      );
    }

    // Check if this is part of multi-checkout by looking for other transactions with same midtransOrderId
    let relatedTransactions: any[] = [];
    let isMultiCheckout = false;

    if (transaction.midtransOrderId) {
      // Find all transactions with the same midtransOrderId (excluding current transaction)
      const allTransactionsInGroup = await Transaction.find({
        midtransOrderId: transaction.midtransOrderId,
        _id: { $ne: transaction._id }, // Exclude current transaction
      }).exec();

      if (allTransactionsInGroup.length > 0) {
        isMultiCheckout = true;
        relatedTransactions = allTransactionsInGroup.map((t: any) =>
          toSafeRelatedTransaction(t),
        );
      }
    }

    // Transform data - use safe helper (no sensitive fields)
    const transformedTransaction = {
      ...toSafeTransaction(transaction),
      isMultiCheckout,
      relatedTransactions,
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
      { status: 500 },
    );
  }
}

// POST method untuk pencarian dengan body (opsional)
export async function POST(request: NextRequest) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID diperlukan" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Check if this is part of multi-checkout by looking for other transactions with same midtransOrderId
    let relatedTransactions: any[] = [];
    let isMultiCheckout = false;

    if (transaction.midtransOrderId) {
      // Find all transactions with the same midtransOrderId (excluding current transaction)
      const allTransactionsInGroup = await Transaction.find({
        midtransOrderId: transaction.midtransOrderId,
        _id: { $ne: transaction._id }, // Exclude current transaction
      }).exec();

      if (allTransactionsInGroup.length > 0) {
        isMultiCheckout = true;
        relatedTransactions = allTransactionsInGroup.map((t: any) =>
          toSafeRelatedTransaction(t),
        );
      }
    }

    // Transform data - use safe helper (no sensitive fields)
    const transformedTransaction = {
      ...toSafeTransaction(transaction),
      isMultiCheckout,
      relatedTransactions,
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
      { status: 500 },
    );
  }
}
