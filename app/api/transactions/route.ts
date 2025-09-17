import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import MidtransService from "@/lib/midtrans";
import EmailService from "@/lib/email";

// GET - Ambil semua transaksi user atau admin
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isAdmin = searchParams.get("admin") === "true";
    const isExport = searchParams.get("export") === "true";
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    const query: any = {};

    if (userId && !isAdmin) {
      query["customerInfo.userId"] = userId;
    }

    if (status) {
      if (status.includes("payment:")) {
        query.paymentStatus = status.replace("payment:", "");
      } else if (status.includes("order:")) {
        query.orderStatus = status.replace("order:", "");
      } else {
        // Default to payment status
        query.paymentStatus = status;
      }
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { invoiceId: { $regex: search, $options: "i" } },
        { robloxUsername: { $regex: search, $options: "i" } },
        { serviceName: { $regex: search, $options: "i" } },
        { "customerInfo.name": { $regex: search, $options: "i" } },
        { "customerInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    // Handle export request
    if (isExport) {
      const exportTransactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .populate("customerInfo.userId", "username email");

      // Convert to CSV
      const csvHeaders = [
        "Invoice ID",
        "Date",
        "Username",
        "Service Type",
        "Service Name",
        "Subtotal",
        "Discount %",
        "Discount Amount",
        "Final Amount",
        "Payment Status",
        "Order Status",
        "Customer Name",
        "Customer Email",
      ];

      const csvData = exportTransactions.map((t) => [
        t.invoiceId,
        new Date(t.createdAt).toLocaleDateString("id-ID"),
        t.robloxUsername,
        t.serviceType,
        t.serviceName,
        t.totalAmount,
        t.discountPercentage || 0,
        t.discountAmount || 0,
        t.finalAmount || t.totalAmount,
        t.paymentStatus,
        t.orderStatus,
        t.customerInfo?.name || "-",
        t.customerInfo?.email || "-",
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    if (userId && !isAdmin) {
      query.userId = userId;
    }

    if (status) {
      if (status.includes("payment:")) {
        query.paymentStatus = status.replace("payment:", "");
      } else if (status.includes("order:")) {
        query.orderStatus = status.replace("order:", "");
      } else {
        // Default to payment status
        query.paymentStatus = status;
      }
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Get statistics if admin
    let statistics = null;
    if (isAdmin) {
      // Calculate basic statistics
      const totalTransactions = await Transaction.countDocuments();
      const paidTransactions = await Transaction.countDocuments({
        paymentStatus: "settlement",
      });
      const pendingTransactions = await Transaction.countDocuments({
        paymentStatus: "pending",
      });
      const failedTransactions = await Transaction.countDocuments({
        paymentStatus: "failed",
      });

      // Calculate total revenue using finalAmount or totalAmount
      const revenueResult = await Transaction.aggregate([
        { $match: { paymentStatus: "settlement" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: ["$finalAmount", "$totalAmount"],
              },
            },
          },
        },
      ]);

      statistics = {
        totalTransactions,
        paidTransactions,
        pendingTransactions,
        failedTransactions,
        totalRevenue: revenueResult[0]?.total || 0,
      };
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Buat transaksi baru
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log("=== API TRANSACTION DEBUG ===");
    console.log("Received body:", body);

    const {
      serviceType,
      serviceId,
      serviceName,
      serviceImage,
      serviceCategory, // Tambahkan serviceCategory
      quantity,
      unitPrice,
      totalAmount,
      discountPercentage,
      discountAmount,
      finalAmount,
      robloxUsername,
      robloxPassword,
      jokiDetails,
      customerInfo,
      userId,
    } = body;

    console.log("Extracted fields:", {
      serviceType,
      serviceId,
      serviceName,
      serviceImage,
      serviceCategory,
      quantity,
      unitPrice,
      robloxUsername: robloxUsername ? "[PRESENT]" : "[MISSING]",
      robloxPassword: robloxPassword ? "[PRESENT]" : "[MISSING]",
      jokiDetails,
      customerInfo,
      userId,
      "customerInfo.userId": customerInfo?.userId,
      "userId from body": userId,
    });

    // Validasi input - userId opsional untuk guest checkout
    // Password hanya diperlukan untuk robux instant dan joki, tidak untuk gamepass dan robux 5 hari
    let passwordRequired = false;

    if (serviceType === "robux") {
      // Untuk robux, cek kategori
      passwordRequired = serviceCategory === "robux_instant" && !robloxPassword;
    } else if (serviceType === "joki") {
      // Untuk joki, password selalu diperlukan
      passwordRequired = !robloxPassword;
    }
    // Untuk gamepass, password tidak diperlukan (passwordRequired tetap false)

    if (
      !serviceType ||
      !serviceId ||
      !serviceName ||
      !quantity ||
      !unitPrice ||
      !robloxUsername ||
      passwordRequired
    ) {
      console.error("Validation failed - missing fields:", {
        serviceType: !!serviceType,
        serviceId: !!serviceId,
        serviceName: !!serviceName,
        quantity: !!quantity,
        unitPrice: !!unitPrice,
        robloxUsername: !!robloxUsername,
        robloxPassword: !!robloxPassword,
        passwordRequired,
        serviceTypeNeedsPassword:
          serviceType === "joki" ||
          (serviceType === "robux" && serviceCategory === "robux_instant"),
        serviceCategory,
        userId: !!userId,
        hasCustomerInfo: !!customerInfo,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validasi customerInfo untuk guest checkout
    if (
      !userId &&
      (!customerInfo || !customerInfo.name || !customerInfo.email)
    ) {
      console.error("Guest checkout requires customer info:", customerInfo);
      return NextResponse.json(
        { error: "Customer information required for guest checkout" },
        { status: 400 }
      );
    }

    // Use provided amount or calculate if not provided
    const calculatedTotalAmount = totalAmount || quantity * unitPrice;
    const calculatedFinalAmount = finalAmount || calculatedTotalAmount;

    // Buat transaksi baru
    const transactionData: any = {
      serviceType,
      serviceId,
      serviceName,
      serviceImage,
      quantity,
      unitPrice,
      totalAmount: calculatedTotalAmount,
      discountPercentage: discountPercentage || 0,
      discountAmount: discountAmount || 0,
      finalAmount: calculatedFinalAmount,
      robloxUsername,
      robloxPassword: robloxPassword || "", // Empty string for gamepass and robux_5_hari
      jokiDetails: serviceType === "joki" ? jokiDetails : undefined,
      customerInfo: {
        ...customerInfo,
        userId: userId || null, // Store userId in customerInfo
      },
    };

    console.log("=== Transaction Data Debug ===");
    console.log("Final userId for customerInfo:", userId || null);
    console.log("Final customerInfo:", {
      ...customerInfo,
      userId: userId || null,
    });
    console.log(
      "Final transactionData.customerInfo:",
      transactionData.customerInfo
    );

    // Only add serviceCategory for robux services
    if (serviceType === "robux" && serviceCategory) {
      transactionData.serviceCategory = serviceCategory;
    }

    const transaction = new Transaction(transactionData);

    console.log(
      "Transaction created with password:",
      robloxPassword ? "[PRESENT]" : "[EMPTY]"
    );

    // Generate Midtrans order ID
    const midtransOrderId = transaction.generateMidtransOrderId();

    // Prepare items for Midtrans - adjust price if there's a discount
    const finalUnitPrice = Math.round(calculatedFinalAmount / quantity);
    const items = [
      {
        id: serviceId,
        price: finalUnitPrice, // Use final unit price after discount
        quantity: quantity,
        name:
          discountPercentage > 0
            ? `${serviceName} (Diskon ${discountPercentage}%)`
            : serviceName,
        brand: "RBX Store",
        category: serviceType,
      },
    ];

    // Prepare customer details
    const customer = {
      first_name: customerInfo.name || robloxUsername,
      email: customerInfo.email || "",
      phone: customerInfo.phone || "",
    };

    // Create Midtrans Snap transaction
    try {
      const midtransService = new MidtransService();

      // Debug environment variables
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      console.log("=== CALLBACK URLs DEBUG ===");
      console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
      console.log("Base URL used:", baseUrl);
      console.log(
        "Finish URL:",
        `${baseUrl}/transaction/success?order_id=${midtransOrderId}`
      );

      const snapResult = await midtransService.createSnapTransaction({
        orderId: midtransOrderId,
        amount: calculatedFinalAmount, // Use final amount after discount
        items,
        customer,
        expiryHours: 24,
        callbackUrls: {
          finish: `${baseUrl}/transaction/success?order_id=${midtransOrderId}`,
          error: `${baseUrl}/transaction/failed?order_id=${midtransOrderId}`,
          pending: `${baseUrl}/transaction/pending?order_id=${midtransOrderId}`,
        },
      });

      // Update transaction dengan data Midtrans
      transaction.snapToken = snapResult.token;
      transaction.redirectUrl = snapResult.redirect_url;
      transaction.midtransOrderId = midtransOrderId;

      // Save transaction
      await transaction.save();

      console.log("Transaction saved successfully:", transaction.invoiceId);

      // Send invoice email to customer
      try {
        if (customerInfo.email) {
          console.log("Sending invoice email to:", customerInfo.email);
          const emailSent = await EmailService.sendInvoiceEmail(transaction);
          if (emailSent) {
            console.log("Invoice email sent successfully");
          } else {
            console.warn(
              "Failed to send invoice email, but transaction was created"
            );
          }
        } else {
          console.warn("No customer email provided, skipping invoice email");
        }
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
        // Don't fail the transaction if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          transaction: transaction,
          snapToken: snapResult.token,
          redirectUrl: snapResult.redirect_url,
        },
      });
    } catch (midtransError) {
      console.error("Midtrans Error:", midtransError);
      return NextResponse.json(
        { error: "Failed to create payment gateway. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
