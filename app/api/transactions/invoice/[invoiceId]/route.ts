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
        relatedTransactions = allTransactionsInGroup.map((t: any) => ({
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
          robloxUsername: t.robloxUsername,
          orderStatus: t.orderStatus,
          invoiceId: t.invoiceId,
          createdAt: t.createdAt,
        }));
      }
    }

    console.log("=== TRACK ORDER DEBUG ===");
    console.log("Invoice ID:", transaction.invoiceId);
    console.log("Midtrans Order ID:", transaction.midtransOrderId);
    console.log("Is Multi-Checkout:", isMultiCheckout);
    console.log("Related Transactions Count:", relatedTransactions.length);
    console.log("Main Transaction Discount:", transaction.discountAmount);
    console.log("Main Transaction Final Amount:", transaction.finalAmount);

    // Transform data untuk frontend
    const transformedTransaction = {
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      serviceCategory: transaction.serviceCategory,
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
      robuxInstantDetails: transaction.robuxInstantDetails || {},
      rbx5Details: transaction.rbx5Details || {},
      gamepass: transaction.gamepass || {},
      gamepassDetails: transaction.gamepassDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      // Payment method fields
      paymentMethodId: transaction.paymentMethodId,
      paymentMethodName: transaction.paymentMethodName || null,
      // Payment fee (for multi-checkout, only stored in first transaction)
      paymentFee: transaction.paymentFee || 0,
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
      // Multi-checkout fields
      isMultiCheckout: isMultiCheckout,
      relatedTransactions: relatedTransactions,
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
        relatedTransactions = allTransactionsInGroup.map((t: any) => ({
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
          robloxUsername: t.robloxUsername,
          orderStatus: t.orderStatus,
          invoiceId: t.invoiceId,
          createdAt: t.createdAt,
        }));
      }
    }

    // Transform data untuk frontend
    const transformedTransaction = {
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      serviceCategory: transaction.serviceCategory,
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
      robuxInstantDetails: transaction.robuxInstantDetails || {},
      rbx5Details: transaction.rbx5Details || {},
      gamepass: transaction.gamepass || {},
      gamepassDetails: transaction.gamepassDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      // Payment method fields
      paymentMethodId: transaction.paymentMethodId,
      paymentMethodName: transaction.paymentMethodName || null,
      // Payment fee (for multi-checkout, only stored in first transaction)
      paymentFee: transaction.paymentFee || 0,
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
      // Multi-checkout fields
      isMultiCheckout: isMultiCheckout,
      relatedTransactions: relatedTransactions,
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
