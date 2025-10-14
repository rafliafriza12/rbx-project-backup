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

    console.log("=== GET TRANSACTIONS DEBUG ===");
    console.log("Received userId:", userId);
    console.log("isAdmin:", isAdmin);
    console.log(
      "All search params:",
      Object.fromEntries(searchParams.entries())
    );

    // Build query
    const query: any = {};

    if (userId && !isAdmin) {
      query["customerInfo.userId"] = userId;
      console.log("Applied filter - customerInfo.userId:", userId);
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

    // Remove duplicate userId filtering since it's already handled above with customerInfo.userId
    // The Transaction model doesn't have a top-level userId field

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

    console.log("=== DATABASE QUERY DEBUG ===");
    console.log("Final query:", JSON.stringify(query, null, 2));
    console.log("Skip:", skip);
    console.log("Limit:", limit);

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Found transactions count:", transactions.length);
    console.log(
      "Sample transaction (first one):",
      transactions[0]
        ? {
            invoiceId: transactions[0].invoiceId,
            customerInfo: transactions[0].customerInfo,
            paymentStatus: transactions[0].paymentStatus,
            orderStatus: transactions[0].orderStatus,
          }
        : "No transactions found"
    );

    // Get total count
    const total = await Transaction.countDocuments(query);
    console.log("Total matching documents:", total);

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

// POST - Buat transaksi baru (single item atau multiple items dari beli langsung)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log("=== API TRANSACTION DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));

    // Check if this is a multi-item request (array of items untuk gamepass/joki)
    // Items array means: user beli langsung gamepass/joki dengan multiple items
    const hasItemsArray =
      body.items && Array.isArray(body.items) && body.items.length > 0;

    console.log(
      "Transaction type:",
      hasItemsArray ? "MULTI-ITEM (Direct Purchase)" : "SINGLE-ITEM"
    );

    // If has items array, handle as multi-item transaction
    if (hasItemsArray) {
      return handleMultiItemDirectPurchase(body);
    }

    // Otherwise, handle as single item (robux instant/5hari dengan quantity)
    return handleSingleItemTransaction(body);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// Handler untuk multi-item direct purchase (gamepass/joki dengan multiple items)
async function handleMultiItemDirectPurchase(body: any) {
  const {
    items,
    customerInfo,
    userId,
    totalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
    additionalNotes,
    paymentMethodId, // Frontend sends paymentMethodId
  } = body;

  // Use paymentMethodId as the payment method
  const paymentMethod = paymentMethodId;

  console.log("=== MULTI-ITEM DIRECT PURCHASE DEBUG ===");
  console.log("Number of items:", items.length);
  console.log("Customer info:", customerInfo);
  console.log("User ID:", userId);
  console.log("Additional notes:", additionalNotes);
  console.log("Payment method ID:", paymentMethodId);
  console.log("Payment method:", paymentMethod);

  // Fetch payment method name if paymentMethodId is provided
  let paymentMethodName = null;
  if (paymentMethodId) {
    try {
      const PaymentMethod = (await import("@/models/PaymentMethod")).default;
      const paymentMethodDoc = await PaymentMethod.findById(paymentMethodId);
      if (paymentMethodDoc) {
        paymentMethodName = paymentMethodDoc.name;
      }
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  }

  // CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
  // Karena ada automasi gamepass creation yang harus dijalankan per-transaction
  const rbx5Items = items.filter(
    (item: any) =>
      item.serviceCategory === "robux_5_hari" ||
      (item.serviceType === "robux" && item.rbx5Details)
  );

  if (rbx5Items.length > 1) {
    return NextResponse.json(
      {
        error:
          "Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation. Silakan checkout item Rbx 5 Hari secara terpisah.",
      },
      { status: 400 }
    );
  }

  // Validasi customerInfo
  if (!customerInfo || !customerInfo.name || !customerInfo.email) {
    return NextResponse.json(
      { error: "Customer information is required" },
      { status: 400 }
    );
  }

  const createdTransactions = [];
  const midtransItems = [];

  // Create transaction for each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    console.log(`Processing item ${i + 1}:`, item);

    // Validasi item
    if (
      !item.serviceType ||
      !item.serviceId ||
      !item.serviceName ||
      !item.quantity ||
      !item.unitPrice
    ) {
      console.error(`Invalid item at index ${i}:`, item);
      return NextResponse.json(
        { error: `Invalid item data at position ${i + 1}` },
        { status: 400 }
      );
    }

    // Validasi username
    if (!item.robloxUsername) {
      console.error(`Missing robloxUsername for item ${i}:`, item);
      return NextResponse.json(
        { error: `Roblox username is required for: ${item.serviceName}` },
        { status: 400 }
      );
    }

    // Check if password is required
    let passwordRequired = false;
    if (item.serviceType === "joki") {
      passwordRequired = !item.robloxPassword;
    } else if (
      item.serviceType === "robux" &&
      item.serviceCategory === "robux_instant"
    ) {
      passwordRequired = !item.robloxPassword;
    }

    if (passwordRequired) {
      return NextResponse.json(
        { error: `Password is required for: ${item.serviceName}` },
        { status: 400 }
      );
    }

    // Calculate amounts for this item
    const itemTotalAmount = item.quantity * item.unitPrice;

    // Prepare transaction data
    const transactionData: any = {
      serviceType: item.serviceType,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      serviceImage: item.serviceImage || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: itemTotalAmount,
      discountPercentage: 0, // Individual items don't get discount
      discountAmount: 0,
      finalAmount: itemTotalAmount,
      robloxUsername: item.robloxUsername,
      robloxPassword: item.robloxPassword || "",
      customerNotes: additionalNotes || "", // Customer notes dari form checkout
      paymentMethodId: paymentMethodId || null,
      paymentMethodName: paymentMethodName,
      customerInfo: {
        ...customerInfo,
        userId: userId || null,
      },
    };

    // Add service-specific details
    if (item.serviceCategory) {
      transactionData.serviceCategory = item.serviceCategory;
    }

    if (item.gamepassDetails) {
      transactionData.gamepassDetails = item.gamepassDetails;
    }

    if (item.jokiDetails) {
      transactionData.jokiDetails = item.jokiDetails;
    }

    if (item.robuxInstantDetails) {
      transactionData.robuxInstantDetails = item.robuxInstantDetails;
    }

    if (item.rbx5Details) {
      transactionData.rbx5Details = item.rbx5Details;
      if (item.rbx5Details.gamepass) {
        transactionData.gamepass = item.rbx5Details.gamepass;
      }
    }

    // Create transaction
    const transaction = new Transaction(transactionData);
    await transaction.save();

    createdTransactions.push(transaction);

    // Prepare Midtrans item
    midtransItems.push({
      id: `${item.serviceId}-${i}`,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.serviceName,
      brand: "RBX Store",
      category: item.serviceType,
    });

    console.log(`Transaction created: ${transaction.invoiceId}`);
  }

  if (createdTransactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions were created" },
      { status: 400 }
    );
  }

  // Calculate final amount with discount (applied to total, not per item)
  const subtotal =
    totalAmount ||
    createdTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const discount = discountAmount || 0;
  const discountPercent = discountPercentage || 0;
  const finalAmountAfterDiscount = finalAmount || subtotal - discount;

  // Update each transaction with proportional discount
  if (discount > 0 && createdTransactions.length > 0) {
    for (const transaction of createdTransactions) {
      // Calculate proportion of this item to subtotal
      const itemProportion = transaction.totalAmount / subtotal;

      // Calculate proportional discount for this item
      const itemDiscountAmount = discount * itemProportion;
      const itemFinalAmount = transaction.totalAmount - itemDiscountAmount;

      // Update transaction with discount info
      transaction.discountPercentage = discountPercent;
      transaction.discountAmount = itemDiscountAmount;
      transaction.finalAmount = itemFinalAmount;

      await transaction.save();
    }
  }

  // Create a master order ID for grouping BEFORE Midtrans call
  const masterOrderId = `ORDER-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  console.log("=== MASTER ORDER ID CREATED ===");
  console.log("Master Order ID:", masterOrderId);

  // Set midtransOrderId for all transactions BEFORE Midtrans call
  createdTransactions.forEach((transaction) => {
    transaction.midtransOrderId = masterOrderId;
  });

  // Calculate sum of items before adding discount and fee
  const itemsSubtotal = midtransItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Add discount item if applicable
  if (discount > 0) {
    midtransItems.push({
      id: "DISCOUNT",
      price: -Math.round(discount),
      quantity: 1,
      name: `Diskon Member (${discountPercentage}%)`,
      brand: "RBX Store",
      category: "discount",
    });
  }

  // Calculate payment fee (difference between final amount and items total)
  const itemsTotal = midtransItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const paymentFee = Math.round(finalAmountAfterDiscount) - itemsTotal;

  // Add payment fee if applicable
  if (paymentFee > 0) {
    midtransItems.push({
      id: "PAYMENT_FEE",
      price: paymentFee,
      quantity: 1,
      name: "Biaya Admin",
      brand: "RBX Store",
      category: "fee",
    });
  }

  // Create Midtrans Snap transaction for all items
  try {
    const midtransService = new MidtransService();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    console.log("=== MIDTRANS MULTI-ITEM DEBUG ===");
    console.log("Items:", JSON.stringify(midtransItems, null, 2));
    console.log("Items subtotal:", itemsSubtotal);
    console.log("Items with discount:", itemsTotal);
    console.log("Payment fee:", paymentFee);
    console.log("Final Amount:", finalAmountAfterDiscount);
    console.log("Payment method:", paymentMethod);

    // Map payment method to Midtrans enabled_payments
    const enabledPayments = paymentMethod
      ? MidtransService.mapPaymentMethodToMidtrans(paymentMethod)
      : undefined;

    console.log("Enabled payments for Midtrans:", enabledPayments);

    const snapResult = await midtransService.createSnapTransaction({
      orderId: masterOrderId,
      amount: Math.round(finalAmountAfterDiscount),
      items: midtransItems,
      customer: {
        first_name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "",
      },
      enabledPayments,
      expiryHours: 24,
      callbackUrls: {
        finish: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
        error: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
        pending: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
      },
    });

    // Update all transactions with Midtrans data (snapToken and redirectUrl)
    const updatePromises = createdTransactions.map(async (transaction) => {
      transaction.snapToken = snapResult.token;
      transaction.redirectUrl = snapResult.redirect_url;
      // midtransOrderId already set before Midtrans call
      await transaction.save();
    });

    await Promise.all(updatePromises);

    console.log(
      `All ${createdTransactions.length} transactions updated with Midtrans data`
    );

    // Send invoice email
    try {
      if (customerInfo.email) {
        console.log("Sending invoice email to:", customerInfo.email);
        const emailSent = await EmailService.sendInvoiceEmail(
          createdTransactions[0]
        );
        if (emailSent) {
          console.log("Invoice email sent successfully");
        }
      }
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        transactions: createdTransactions,
        masterOrderId: masterOrderId,
        snapToken: snapResult.token,
        redirectUrl: snapResult.redirect_url,
        totalTransactions: createdTransactions.length,
        totalAmount: subtotal,
        discountAmount: discount,
        finalAmount: finalAmountAfterDiscount,
      },
    });
  } catch (midtransError) {
    console.error("Midtrans Error:", midtransError);

    // Delete created transactions if Midtrans fails
    const deletePromises = createdTransactions.map((t) =>
      Transaction.findByIdAndDelete(t._id)
    );
    await Promise.all(deletePromises);

    return NextResponse.json(
      { error: "Failed to create payment gateway. Please try again later." },
      { status: 500 }
    );
  }
}

// Handler untuk single item transaction (robux dengan quantity)
async function handleSingleItemTransaction(body: any) {
  const {
    serviceType,
    serviceId,
    serviceName,
    serviceImage,
    serviceCategory,
    quantity,
    unitPrice,
    totalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
    robloxUsername,
    robloxPassword,
    jokiDetails,
    robuxInstantDetails,
    rbx5Details,
    gamepassDetails,
    customerInfo,
    userId,
    gamepass,
    additionalNotes,
    paymentMethodId, // Frontend sends paymentMethodId for single checkout
  } = body;

  // Use paymentMethodId as the payment method
  const paymentMethod = paymentMethodId;

  console.log("Extracted fields:", {
    serviceType,
    serviceId,
    serviceName,
    serviceCategory,
    quantity,
    unitPrice,
    robloxUsername: robloxUsername ? "[PRESENT]" : "[MISSING]",
    robloxPassword: robloxPassword ? "[PRESENT]" : "[MISSING]",
    jokiDetails: jokiDetails ? "[PRESENT]" : "[MISSING]",
    robuxInstantDetails: robuxInstantDetails ? "[PRESENT]" : "[MISSING]",
    rbx5Details: rbx5Details ? "[PRESENT]" : "[MISSING]",
    gamepassDetails: gamepassDetails ? "[PRESENT]" : "[MISSING]",
    customerInfo: customerInfo ? "[PRESENT]" : "[MISSING]",
    userId: userId || "null",
    gamepass: gamepass ? "[PRESENT]" : "[NOT_PROVIDED]",
    additionalNotes: additionalNotes || "[EMPTY]",
    paymentMethodId: paymentMethodId || "[NOT_PROVIDED]",
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
  if (!userId && (!customerInfo || !customerInfo.name || !customerInfo.email)) {
    console.error("Guest checkout requires customer info:", customerInfo);
    return NextResponse.json(
      { error: "Customer information required for guest checkout" },
      { status: 400 }
    );
  }

  // ALWAYS recalculate from quantity × unitPrice (don't trust frontend totalAmount)
  const calculatedTotalAmount = quantity * unitPrice;
  const calculatedFinalAmount = finalAmount || calculatedTotalAmount;

  console.log("Single transaction calculation:", {
    quantity,
    unitPrice,
    calculatedTotal: calculatedTotalAmount,
    frontendTotal: totalAmount,
    match: calculatedTotalAmount === totalAmount,
  });

  // Fetch payment method name and validate paymentMethodId
  let paymentMethodName = null;
  let validPaymentMethodId = null;

  if (paymentMethodId) {
    try {
      const PaymentMethod = (await import("@/models/PaymentMethod")).default;
      const mongoose = await import("mongoose");

      // Check if paymentMethodId is a valid ObjectId string
      if (mongoose.default.Types.ObjectId.isValid(paymentMethodId)) {
        // It's already a valid ObjectId, use it directly
        validPaymentMethodId = paymentMethodId;
        const paymentMethodDoc = await PaymentMethod.findById(paymentMethodId);
        if (paymentMethodDoc) {
          paymentMethodName = paymentMethodDoc.name;
        }
      } else {
        // It's a payment method code (like "bca_va"), find the ObjectId
        console.log(`Looking up payment method by code: ${paymentMethodId}`);
        const paymentMethodDoc = await PaymentMethod.findOne({
          code: paymentMethodId,
        });

        if (paymentMethodDoc) {
          validPaymentMethodId = paymentMethodDoc._id;
          paymentMethodName = paymentMethodDoc.name;
          console.log(
            `Found payment method: ${paymentMethodName} (${validPaymentMethodId})`
          );
        } else {
          console.warn(`Payment method not found for code: ${paymentMethodId}`);
          // Don't throw error, just log warning and continue without paymentMethodId
          validPaymentMethodId = null;
        }
      }
    } catch (error) {
      console.error("Error fetching payment method:", error);
      validPaymentMethodId = null;
    }
  }

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
    customerNotes: additionalNotes || "", // Customer notes dari form checkout
    jokiDetails: serviceType === "joki" ? jokiDetails : undefined,
    robuxInstantDetails: robuxInstantDetails || undefined,
    rbx5Details: rbx5Details || undefined,
    gamepassDetails: gamepassDetails || undefined,
    paymentMethodId: validPaymentMethodId, // Use validated ObjectId or null
    paymentMethodName: paymentMethodName,
    customerInfo: {
      ...customerInfo,
      userId: userId || null, // Store userId in customerInfo
    },
  };

  // Tambahkan data gamepass untuk service robux_5_hari
  if (
    serviceType === "robux" &&
    serviceCategory === "robux_5_hari" &&
    gamepass
  ) {
    transactionData.gamepass = gamepass;
  }

  // Add rbx5Details gamepass if available
  if (rbx5Details && rbx5Details.gamepass) {
    transactionData.gamepass = rbx5Details.gamepass;
  }

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    console.log("=== CALLBACK URLs DEBUG ===");
    console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
    console.log("Base URL used:", baseUrl);
    console.log(
      "Finish URL:",
      `${baseUrl}/transaction/success?order_id=${midtransOrderId}`
    );
    console.log("Payment method:", paymentMethod);

    // Calculate sum of items to check for rounding differences
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const amountDifference = Math.round(calculatedFinalAmount) - itemsTotal;

    // Add payment fee if there's a difference (due to rounding or actual fee)
    if (amountDifference > 0) {
      items.push({
        id: "PAYMENT_FEE",
        price: amountDifference,
        quantity: 1,
        name: "Biaya Admin",
        brand: "RBX Store",
        category: "fee",
      });
    }

    console.log("=== MIDTRANS SINGLE-ITEM DEBUG ===");
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Items total:", itemsTotal);
    console.log("Amount difference:", amountDifference);
    console.log("Final Amount:", calculatedFinalAmount);

    // Map payment method to Midtrans enabled_payments
    const enabledPayments = paymentMethod
      ? MidtransService.mapPaymentMethodToMidtrans(paymentMethod)
      : undefined;

    console.log("Enabled payments for Midtrans:", enabledPayments);

    const snapResult = await midtransService.createSnapTransaction({
      orderId: midtransOrderId,
      amount: calculatedFinalAmount, // Use final amount after discount
      items,
      customer,
      enabledPayments,
      expiryHours: 24,
      callbackUrls: {
        finish: `${baseUrl}/transaction/?order_id=${midtransOrderId}`,
        error: `${baseUrl}/transaction/?order_id=${midtransOrderId}`,
        pending: `${baseUrl}/transaction/?order_id=${midtransOrderId}`,
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
}
