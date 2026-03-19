import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Settings from "@/models/Settings";
import MidtransService from "@/lib/midtrans";
import { duitkuService } from "@/lib/duitku";
import EmailService from "@/lib/email";
import { authenticateToken, requireAdmin } from "@/lib/auth";
import {
  validateSingleTransaction,
  validateMultiTransactionItem,
  getVerifiedDiscount,
  getVerifiedPaymentFee,
  verifyGamepassFromRoblox,
  verifyRobloxUsername,
} from "@/lib/serverValidation";
// Discord notifications are handled via webhook when payment status changes to settlement
// import { notifyNewTransaction } from "@/lib/discord";

// Rate limiter for transaction creation (anti invoice spam)
const txRateLimitStore = new Map<
  string,
  { count: number; resetAt: number; lastCreatedAt: number }
>();
const TX_RATE_LIMIT = 5; // max 5 transactions
const TX_RATE_WINDOW = 10 * 60 * 1000; // per 10 minutes
const TX_COOLDOWN = 30 * 1000; // 30 seconds cooldown between transactions

function isTxRateLimited(identifier: string): {
  limited: boolean;
  message?: string;
} {
  const now = Date.now();
  const entry = txRateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    txRateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + TX_RATE_WINDOW,
      lastCreatedAt: now,
    });
    return { limited: false };
  }

  const timeSinceLast = now - entry.lastCreatedAt;
  if (timeSinceLast < TX_COOLDOWN) {
    const waitSeconds = Math.ceil((TX_COOLDOWN - timeSinceLast) / 1000);
    return {
      limited: true,
      message: `Tunggu ${waitSeconds} detik sebelum membuat transaksi baru`,
    };
  }

  if (entry.count >= TX_RATE_LIMIT) {
    const waitMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return {
      limited: true,
      message: `Terlalu banyak transaksi. Coba lagi dalam ${waitMinutes} menit`,
    };
  }

  entry.count++;
  entry.lastCreatedAt = now;
  return { limited: false };
}

// GET - Ambil semua transaksi (ADMIN ONLY)
// User harus menggunakan /api/transactions/user/[userId] untuk melihat transaksinya sendiri
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // ============================================================
    // ADMIN ONLY: Semua GET ke /api/transactions harus admin
    // ============================================================
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message?.includes("Forbidden") ? 403 : 401;
      return NextResponse.json(
        { error: authError.message || "Unauthorized" },
        { status },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isExport = searchParams.get("export") === "true";
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    const query: any = {};

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

    // Group multi-checkout transactions
    const processedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const transactionObj = transaction.toObject();

        // Check if this is part of a multi-checkout by looking for other transactions with same midtransOrderId
        if (transactionObj.midtransOrderId) {
          const relatedTransactions = await Transaction.find({
            midtransOrderId: transactionObj.midtransOrderId,
            _id: { $ne: transactionObj._id }, // Exclude current transaction
          }).sort({ createdAt: 1 });

          if (relatedTransactions.length > 0) {
            transactionObj.isMultiCheckout = true;
            transactionObj.relatedTransactions = relatedTransactions.map((t) =>
              t.toObject(),
            );
          }
        }

        return transactionObj;
      }),
    );

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Get statistics if admin
    // Statistics (admin only endpoint, always include)
    let statistics = null;
    {
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

    // Admin-only endpoint — return full data without stripping
    return NextResponse.json({
      success: true,
      data: processedTransactions,
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
      { status: 500 },
    );
  }
}

// POST - Buat transaksi baru (single item atau multiple items dari beli langsung)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Auth check: require login OR valid guest checkout data
    const token = request.cookies.get("token")?.value;
    const body = await request.json();

    const isGuestCheckout = !body.userId;
    if (!isGuestCheckout && !token) {
      return NextResponse.json(
        { error: "Unauthorized: Token diperlukan" },
        { status: 401 },
      );
    }

    if (!isGuestCheckout && token) {
      try {
        const user = await authenticateToken(request);
        // Verify userId matches token
        if (user._id.toString() !== body.userId) {
          return NextResponse.json(
            { error: "Forbidden: userId tidak sesuai dengan token" },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Unauthorized: Token tidak valid" },
          { status: 401 },
        );
      }
    }

    // Guest checkout: validate required customer info
    if (isGuestCheckout) {
      if (
        !body.customerInfo?.name ||
        !body.customerInfo?.email ||
        !body.customerInfo?.phone
      ) {
        return NextResponse.json(
          { error: "Guest checkout memerlukan nama, email, dan nomor telepon" },
          { status: 400 },
        );
      }
    }

    // Rate limit check — use userId or guest email as identifier
    const rateLimitKey =
      body.userId ||
      body.customerInfo?.email ||
      request.headers.get("x-forwarded-for") ||
      "unknown";
    const txRateCheck = isTxRateLimited(rateLimitKey);
    if (txRateCheck.limited) {
      return NextResponse.json({ error: txRateCheck.message }, { status: 429 });
    }

    console.log("=== API TRANSACTION DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));

    // Check if this is a multi-item request (array of items untuk gamepass/joki)
    // Items array means: user beli langsung gamepass/joki dengan multiple items
    const hasItemsArray =
      body.items && Array.isArray(body.items) && body.items.length > 0;

    console.log(
      "Transaction type:",
      hasItemsArray ? "MULTI-ITEM (Direct Purchase)" : "SINGLE-ITEM",
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
      { status: 500 },
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
    paymentFee: rawPaymentFee, // Receive payment fee from frontend
    additionalNotes,
    paymentMethodId, // Frontend sends paymentMethodId
  } = body;

  // Ensure paymentFee is a number
  const paymentFee = rawPaymentFee ? Number(rawPaymentFee) : 0;

  // Use paymentMethodId as the payment method
  const paymentMethod = paymentMethodId;

  console.log("=== MULTI-ITEM DIRECT PURCHASE DEBUG ===");
  console.log("Number of items:", items.length);
  console.log("Customer info:", customerInfo);
  console.log("User ID:", userId);
  console.log("Total Amount:", totalAmount);
  console.log("Discount Percentage:", discountPercentage);
  console.log("Discount Amount:", discountAmount);
  console.log("Final Amount:", finalAmount);
  console.log("Payment Fee (raw):", rawPaymentFee);
  console.log("Payment Fee (converted):", paymentFee);
  console.log("Additional notes:", additionalNotes);
  console.log("Payment method ID:", paymentMethodId);
  console.log("Payment method:", paymentMethod);

  // Fetch payment method name and validate paymentMethodId (can be ObjectId or code)
  // ============================================================
  // SERVER-SIDE VALIDATION: Validasi diskon & payment fee dari DB
  // ============================================================
  const verifiedDiscount = await getVerifiedDiscount(userId);
  const verifiedDiscountPercentage = verifiedDiscount.discountPercentage;

  console.log("✅ Verified discount from DB:", verifiedDiscountPercentage, "%");
  if (discountPercentage && discountPercentage !== verifiedDiscountPercentage) {
    console.warn(
      `⚠️ DISCOUNT MISMATCH! Frontend: ${discountPercentage}%, DB: ${verifiedDiscountPercentage}%`,
    );
  }

  // CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
  // Karena ada automasi gamepass creation yang harus dijalankan per-transaction
  const rbx5Items = items.filter(
    (item: any) =>
      item.serviceCategory === "robux_5_hari" ||
      (item.serviceType === "robux" && item.rbx5Details),
  );

  if (rbx5Items.length > 1) {
    return NextResponse.json(
      {
        error:
          "Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation. Silakan checkout item Rbx 5 Hari secara terpisah.",
      },
      { status: 400 },
    );
  }

  // Validasi customerInfo
  if (!customerInfo || !customerInfo.name || !customerInfo.email) {
    return NextResponse.json(
      { error: "Customer information is required" },
      { status: 400 },
    );
  }

  const createdTransactions = [];
  const midtransItems = [];

  // Create transaction for each item - VALIDATE PRICES FROM DB
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    console.log(`Processing item ${i + 1}:`, item);

    // Validasi item
    // unitPrice is NOT required — server computes all prices from DB
    if (
      !item.serviceType ||
      !item.serviceId ||
      !item.serviceName ||
      !item.quantity
    ) {
      console.error(`Invalid item at index ${i}:`, item);
      return NextResponse.json(
        { error: `Invalid item data at position ${i + 1}` },
        { status: 400 },
      );
    }

    // Validasi username
    if (!item.robloxUsername) {
      console.error(`Missing robloxUsername for item ${i}:`, item);
      return NextResponse.json(
        { error: `Roblox username is required for: ${item.serviceName}` },
        { status: 400 },
      );
    }

    // Verifikasi username ke Roblox API (anti-spoof)
    const usernameVerification = await verifyRobloxUsername(
      item.robloxUsername,
    );
    if (!usernameVerification.valid) {
      console.error(
        `❌ Roblox username verification failed for item ${i}: ${usernameVerification.error}`,
      );
      return NextResponse.json(
        {
          error:
            usernameVerification.error ||
            `Username Roblox "${item.robloxUsername}" tidak valid`,
        },
        { status: 400 },
      );
    }
    // Use verified username from Roblox (exact casing)
    item.robloxUsername = usernameVerification.verifiedUsername!;
    const itemRobloxUserId = usernameVerification.userId;

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
        { status: 400 },
      );
    }

    // ============================================================
    // SERVER-SIDE: Validasi harga item dari database
    // ============================================================
    const itemValidation = await validateMultiTransactionItem(item, i);
    if (!itemValidation.valid) {
      console.error(
        `❌ Item ${i + 1} validation failed:`,
        itemValidation.error,
      );
      return NextResponse.json(
        { error: itemValidation.error || `Harga item ${i + 1} tidak valid` },
        { status: 400 },
      );
    }

    // Gunakan harga terverifikasi dari database
    const verifiedItemUnitPrice = itemValidation.verifiedUnitPrice;
    const verifiedItemTotalAmount = itemValidation.verifiedTotalAmount;

    console.log(
      `✅ Item ${i + 1} price verified: frontend=${item.unitPrice}, DB=${verifiedItemUnitPrice}`,
    );

    // Prepare transaction data - GUNAKAN HARGA TERVERIFIKASI
    const transactionData: any = {
      serviceType: item.serviceType,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      serviceImage: item.serviceImage || "",
      quantity: item.quantity,
      unitPrice: verifiedItemUnitPrice,
      totalAmount: verifiedItemTotalAmount,
      discountPercentage: 0, // Individual items don't get discount
      discountAmount: 0,
      finalAmount: verifiedItemTotalAmount,
      robloxUsername: item.robloxUsername,
      robloxPassword: item.robloxPassword || "",
      customerNotes: additionalNotes || "", // Customer notes dari form checkout
      paymentMethodId: paymentMethodId || null,
      paymentMethodName: null, // Will be set after payment method validation
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
      // SANITIZE gamepassDetails: use verified data from DB, only allow additionalInfo from client
      if (itemValidation.verifiedGamepassDetails) {
        transactionData.gamepassDetails = {
          gameName: itemValidation.verifiedGamepassDetails.gameName,
          itemName: itemValidation.verifiedGamepassDetails.itemName,
          gamepassId: itemValidation.verifiedGamepassDetails.gamepassId,
          additionalInfo: item.gamepassDetails.additionalInfo || "",
        };
      } else {
        transactionData.gamepassDetails = {
          additionalInfo: item.gamepassDetails.additionalInfo || "",
        };
      }
    }

    if (item.jokiDetails) {
      transactionData.jokiDetails = item.jokiDetails;
    }

    if (item.robuxInstantDetails) {
      // SANITIZE robuxInstantDetails: use verified data from DB, only allow notes from client
      if (itemValidation.verifiedRobuxInstantDetails) {
        transactionData.robuxInstantDetails = {
          robuxAmount: itemValidation.verifiedRobuxInstantDetails.robuxAmount,
          productName: itemValidation.verifiedRobuxInstantDetails.productName,
          description: itemValidation.verifiedRobuxInstantDetails.description,
          notes: item.robuxInstantDetails.notes || "",
          additionalInfo: item.robuxInstantDetails.additionalInfo || "",
        };
      } else {
        transactionData.robuxInstantDetails = {
          notes: item.robuxInstantDetails.notes || "",
          additionalInfo: item.robuxInstantDetails.additionalInfo || "",
        };
      }
    }

    if (item.rbx5Details) {
      // VERIFY gamepass via Roblox API if gamepass data exists
      let verifiedGamepass = item.rbx5Details.gamepass;
      if (
        item.rbx5Details.gamepass &&
        item.rbx5Details.selectedPlace?.placeId
      ) {
        const expectedGamepassPrice =
          itemValidation.verifiedGamepassAmount ||
          item.rbx5Details.gamepass.price;
        const robloxCheck = await verifyGamepassFromRoblox(
          item.rbx5Details.selectedPlace.placeId,
          expectedGamepassPrice,
        );
        if (!robloxCheck.valid || !robloxCheck.gamepass) {
          console.error(
            `❌ Gamepass verification failed for item ${i + 1}:`,
            robloxCheck.error,
          );
          return NextResponse.json(
            {
              error:
                robloxCheck.error ||
                `GamePass tidak valid untuk item ${i + 1}. Pastikan GamePass sudah dibuat dengan benar.`,
            },
            { status: 400 },
          );
        }
        verifiedGamepass = robloxCheck.gamepass;
        console.log(
          `✅ Item ${i + 1} gamepass verified from Roblox API:`,
          verifiedGamepass,
        );

        // Cross-check: sellerId gamepass harus = userId dari robloxUsername
        if (itemRobloxUserId && verifiedGamepass.sellerId) {
          if (verifiedGamepass.sellerId !== itemRobloxUserId) {
            console.error(
              `❌ Item ${i + 1} seller ID mismatch! Gamepass sellerId=${verifiedGamepass.sellerId}, but robloxUsername "${item.robloxUsername}" has userId=${itemRobloxUserId}`,
            );
            return NextResponse.json(
              {
                error: `GamePass item ${i + 1} bukan milik akun "${item.robloxUsername}". Pemilik GamePass tidak sesuai dengan username yang dimasukkan.`,
              },
              { status: 400 },
            );
          }
          console.log(
            `✅ Item ${i + 1} seller ID match: sellerId=${verifiedGamepass.sellerId} === userId=${itemRobloxUserId}`,
          );
        }
      }

      // SANITIZE rbx5Details: ALL gamepass data from Roblox API, not client
      transactionData.rbx5Details = {
        robuxAmount:
          itemValidation.verifiedRobuxAmount || item.rbx5Details.robuxAmount,
        gamepassAmount:
          itemValidation.verifiedGamepassAmount ||
          item.rbx5Details.gamepassAmount,
        packageName: item.rbx5Details.packageName,
        selectedPlace: item.rbx5Details.selectedPlace
          ? {
              placeId: item.rbx5Details.selectedPlace.placeId,
              name: item.rbx5Details.selectedPlace.name,
            }
          : undefined,
        gamepassCreated: item.rbx5Details.gamepassCreated,
        gamepass: verifiedGamepass
          ? {
              id: verifiedGamepass.id,
              name: verifiedGamepass.name,
              price: verifiedGamepass.price,
              productId: verifiedGamepass.productId,
              sellerId: verifiedGamepass.sellerId,
            }
          : undefined,
        pricePerRobux: itemValidation.verifiedPricePerHundred
          ? itemValidation.verifiedPricePerHundred / 100
          : item.rbx5Details.pricePerRobux,
      };
      if (verifiedGamepass) {
        transactionData.gamepass = {
          id: verifiedGamepass.id,
          name: verifiedGamepass.name,
          price: verifiedGamepass.price,
          productId: verifiedGamepass.productId,
          sellerId: verifiedGamepass.sellerId,
        };
      }
    }

    // Create transaction
    const transaction = new Transaction(transactionData);
    await transaction.save();

    createdTransactions.push(transaction);

    // Prepare Midtrans item (will apply discount later) - USE VERIFIED PRICE
    midtransItems.push({
      id: `${item.serviceId}-${i}`,
      price: verifiedItemUnitPrice, // Verified price from DB
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
      { status: 400 },
    );
  }

  // ============================================================
  // SERVER-SIDE: Hitung ulang total, diskon, dan payment fee dari DB
  // ============================================================
  // Subtotal dihitung dari harga terverifikasi (bukan frontend)
  const subtotal = createdTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0,
  );

  // Diskon dihitung dari DB (bukan frontend)
  const verifiedDiscountAmount = Math.round(
    (subtotal * verifiedDiscountPercentage) / 100,
  );

  console.log("=== MULTI-ITEM PRICE CALCULATION (VERIFIED) ===");
  console.log("Subtotal (verified from DB):", subtotal);
  console.log("Discount % (verified from DB):", verifiedDiscountPercentage);
  console.log("Discount Amount (calculated):", verifiedDiscountAmount);

  if (discountAmount && Math.abs(discountAmount - verifiedDiscountAmount) > 1) {
    console.warn(
      `⚠️ DISCOUNT AMOUNT MISMATCH! Frontend: ${discountAmount}, Calculated: ${verifiedDiscountAmount}`,
    );
  }

  const verifiedFinalAmountBeforeFee = subtotal - verifiedDiscountAmount;

  // Update each transaction with VERIFIED proportional discount
  if (verifiedDiscountAmount > 0 && createdTransactions.length > 0) {
    for (const transaction of createdTransactions) {
      // Calculate proportion of this item to subtotal
      const itemProportion = transaction.totalAmount / subtotal;

      // Calculate proportional discount for this item
      const itemDiscountAmount = Math.round(
        verifiedDiscountAmount * itemProportion,
      );
      const itemFinalAmount = transaction.totalAmount - itemDiscountAmount;

      // Update transaction with VERIFIED discount info
      transaction.discountPercentage = verifiedDiscountPercentage;
      transaction.discountAmount = itemDiscountAmount;
      transaction.finalAmount = itemFinalAmount;

      await transaction.save();
    }
  }

  // Validasi & hitung payment fee dari DB (bukan frontend)
  const feeCheck = await getVerifiedPaymentFee(
    paymentMethodId,
    verifiedFinalAmountBeforeFee,
  );
  const verifiedPaymentFee = feeCheck.fee;
  const paymentMethodName = feeCheck.paymentMethodName;
  const validPaymentMethodId = feeCheck.validPaymentMethodId;
  const paymentMethodDoc = feeCheck.paymentMethodDoc;

  console.log("Payment Fee (verified from DB):", verifiedPaymentFee);
  if (
    rawPaymentFee &&
    Math.abs(Number(rawPaymentFee) - verifiedPaymentFee) > 1
  ) {
    console.warn(
      `⚠️ PAYMENT FEE MISMATCH! Frontend: ${rawPaymentFee}, DB: ${verifiedPaymentFee}`,
    );
  }

  // Update payment method name on all transactions
  if (paymentMethodName) {
    for (const transaction of createdTransactions) {
      transaction.paymentMethodName = paymentMethodName;
      if (validPaymentMethodId) {
        transaction.paymentMethodId = validPaymentMethodId;
      }
    }
  }

  // Store VERIFIED payment fee in the first transaction
  if (verifiedPaymentFee > 0 && createdTransactions.length > 0) {
    createdTransactions[0].paymentFee = verifiedPaymentFee;
    console.log(
      "Verified payment fee set to first transaction:",
      verifiedPaymentFee,
    );
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

  // Apply VERIFIED discount to each Midtrans item price (proportionally)
  if (verifiedDiscountAmount > 0 && midtransItems.length > 0) {
    const discountMultiplier = 1 - verifiedDiscountPercentage / 100;
    midtransItems.forEach((item) => {
      const originalPrice = item.price;
      item.price = Math.round(item.price * discountMultiplier);

      // Update item name to show discount
      if (!item.name.includes("Diskon")) {
        item.name = `${item.name} (Diskon ${verifiedDiscountPercentage}%)`;
      }

      console.log(
        `Item: ${item.name}, Original: ${originalPrice}, Discounted: ${item.price}`,
      );
    });
  }

  // Calculate sum of items AFTER applying discount (BEFORE payment fee)
  const itemsTotal = midtransItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  console.log("Items total after discount (before payment fee):", itemsTotal);

  // Add VERIFIED payment fee if applicable
  if (verifiedPaymentFee > 0) {
    console.log("✅ ADDING verified payment fee to items:", verifiedPaymentFee);
    midtransItems.push({
      id: "PAYMENT_FEE",
      price: verifiedPaymentFee,
      quantity: 1,
      name: "Biaya Admin",
      brand: "RBX Store",
      category: "fee",
    });
  }

  console.log("Final midtransItems:", JSON.stringify(midtransItems, null, 2));

  // Get active payment gateway from settings
  const settings = await Settings.getSiteSettings();
  const activeGateway = settings.activePaymentGateway || "midtrans";

  console.log("=== PAYMENT GATEWAY SELECTION ===");
  console.log("Active Payment Gateway:", activeGateway);

  // Create payment gateway transaction
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Calculate total items amount
    const totalItemsAmount = midtransItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    console.log("=== MULTI-ITEM PAYMENT DEBUG (VERIFIED) ===");
    console.log("Items:", JSON.stringify(midtransItems, null, 2));
    console.log("Payment fee (verified from DB):", verifiedPaymentFee);
    console.log("Final Amount (verified):", verifiedFinalAmountBeforeFee);
    console.log("Payment method:", paymentMethod);
    console.log("Total items amount:", totalItemsAmount);

    let paymentResult: {
      token?: string;
      redirect_url?: string;
      paymentUrl?: string;
      reference?: string;
      vaNumber?: string;
      qrString?: string;
      qrCodeUrl?: string;
      transactionId?: string;
    };

    if (activeGateway === "duitku") {
      // ===== DUITKU PAYMENT GATEWAY =====
      console.log("Using Duitku payment gateway");

      await duitkuService.initializeConfig();

      // Get Duitku payment code from PaymentMethod (already fetched above)
      let duitkuPaymentCode = "VC"; // Default to credit card
      if (paymentMethodDoc && paymentMethodDoc.duitkuCode) {
        duitkuPaymentCode = paymentMethodDoc.duitkuCode;
      }

      console.log("Duitku payment code:", duitkuPaymentCode);

      // Build product details string
      const productDetails = midtransItems
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", ");

      const duitkuResult = await duitkuService.createTransaction({
        orderId: masterOrderId,
        amount: totalItemsAmount,
        paymentMethod: duitkuPaymentCode,
        productDetails: productDetails.substring(0, 255), // Max 255 chars
        customer: {
          firstName: customerInfo.name,
          email: customerInfo.email,
          phoneNumber: customerInfo.phone || "",
        },
        returnUrl: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
        callbackUrl: `${baseUrl}/api/transactions/webhook/duitku`,
      });

      paymentResult = {
        paymentUrl: duitkuResult.paymentUrl,
        reference: duitkuResult.reference,
        vaNumber: duitkuResult.vaNumber,
        qrString: duitkuResult.qrString,
      };

      // Update all transactions with Duitku data
      const updatePromises = createdTransactions.map(
        async (transaction, index) => {
          transaction.paymentGateway = "duitku";
          transaction.duitkuOrderId = masterOrderId;
          transaction.duitkuPaymentUrl = duitkuResult.paymentUrl;
          transaction.duitkuReference = duitkuResult.reference || "";
          transaction.duitkuVaNumber = duitkuResult.vaNumber || "";
          transaction.duitkuQrString = duitkuResult.qrString || "";
          transaction.redirectUrl = duitkuResult.paymentUrl; // For backward compatibility

          // Explicitly set VERIFIED payment fee for first transaction
          if (index === 0 && verifiedPaymentFee > 0) {
            transaction.paymentFee = verifiedPaymentFee;
            transaction.markModified("paymentFee");
            console.log(
              "First transaction paymentFee before save:",
              transaction.paymentFee,
            );
          }

          await transaction.save();
        },
      );

      await Promise.all(updatePromises);

      console.log(
        `All ${createdTransactions.length} transactions updated with Duitku data`,
      );
    } else {
      // ===== MIDTRANS PAYMENT GATEWAY =====
      console.log("Using Midtrans payment gateway");

      const midtransService = new MidtransService();

      // Get the payment method code from the document (if found)
      // paymentMethodDoc was fetched earlier when validating paymentMethodId
      const paymentMethodCode =
        paymentMethodDoc?.code?.toLowerCase() || paymentMethod?.toLowerCase();

      console.log("Payment method code:", paymentMethodCode);
      console.log(
        "Payment method doc:",
        paymentMethodDoc
          ? { code: paymentMethodDoc.code, name: paymentMethodDoc.name }
          : "not found",
      );

      // Map payment method to Midtrans enabled_payments
      const enabledPayments = paymentMethodCode
        ? MidtransService.mapPaymentMethodToMidtrans(paymentMethodCode)
        : undefined;

      console.log("Enabled payments for Midtrans:", enabledPayments);

      // Initialize paymentResult with default values
      paymentResult = {
        token: undefined,
        redirect_url: undefined,
        qrCodeUrl: undefined,
        qrString: undefined,
        transactionId: undefined,
      };

      // Check if payment method is GoPay or QRIS - try Core API for direct QR
      // Use paymentMethodCode which is the actual code like "gopay", "qris", etc.
      const isGopayDirect = paymentMethodCode === "gopay";
      const isQrisDirect = paymentMethodCode === "qris";

      console.log(
        `isGopayDirect: ${isGopayDirect}, isQrisDirect: ${isQrisDirect}`,
      );

      let usedCoreApi = false;

      // Always pass enabled_payments to lock the payment method user selected
      // GoPay/QRIS: use their specific mapping so Midtrans only shows that method
      const snapEnabledPayments = enabledPayments;

      console.log(
        "Using Snap API with enabled_payments:",
        snapEnabledPayments || "ALL (no restriction)",
      );

      const snapResult = await midtransService.createSnapTransaction({
        orderId: masterOrderId,
        amount: totalItemsAmount,
        items: midtransItems,
        customer: {
          first_name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || "",
        },
        enabledPayments: snapEnabledPayments,
        expiryHours: 24,
        callbackUrls: {
          finish: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
          error: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
          pending: `${baseUrl}/transaction/?order_id=${masterOrderId}`,
        },
      });

      paymentResult = {
        token: snapResult.token,
        redirect_url: snapResult.redirect_url,
      };

      // Update all transactions with Midtrans data
      const updatePromises = createdTransactions.map(
        async (transaction, index) => {
          transaction.paymentGateway = "midtrans";
          transaction.snapToken = snapResult.token;
          transaction.redirectUrl = snapResult.redirect_url;

          // Explicitly set VERIFIED payment fee for first transaction
          if (index === 0 && verifiedPaymentFee > 0) {
            transaction.paymentFee = verifiedPaymentFee;
            transaction.markModified("paymentFee");
            console.log(
              "First transaction paymentFee before save:",
              transaction.paymentFee,
            );
          }

          await transaction.save();
        },
      );

      await Promise.all(updatePromises);

      console.log(
        `All ${createdTransactions.length} transactions updated with Midtrans data`,
      );
    }

    // Send invoice email
    try {
      if (customerInfo.email) {
        console.log("Sending invoice email to:", customerInfo.email);
        const emailSent = await EmailService.sendInvoiceEmail(
          createdTransactions[0],
        );
        if (emailSent) {
          console.log("Invoice email sent successfully");
        }
      }
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
    }

    // Discord notification removed from transaction creation
    // Notifications are now only sent when payment status changes to "settlement"

    // Sanitize transactions before returning - NEVER expose sensitive fields
    const safeTransactions = createdTransactions.map((t: any) => ({
      _id: t._id,
      invoiceId: t.invoiceId,
      serviceType: t.serviceType,
      serviceCategory: t.serviceCategory,
      serviceName: t.serviceName,
      serviceImage: t.serviceImage,
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      totalAmount: t.totalAmount,
      discountPercentage: t.discountPercentage,
      discountAmount: t.discountAmount,
      finalAmount: t.finalAmount,
      status: t.status,
      paymentGateway: t.paymentGateway,
      paymentMethodName: t.paymentMethodName,
      robloxUsername: t.robloxUsername,
      customerInfo: t.customerInfo
        ? {
            name: t.customerInfo.name,
            email: t.customerInfo.email,
            phone: t.customerInfo.phone,
          }
        : undefined,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: safeTransactions,
        masterOrderId: masterOrderId,
        paymentGateway: activeGateway,
        // Midtrans specific
        snapToken: paymentResult.token || null,
        // Common redirect URL (works for both gateways)
        redirectUrl:
          paymentResult.redirect_url || paymentResult.paymentUrl || null,
        // Duitku specific
        duitkuPaymentUrl: paymentResult.paymentUrl || null,
        duitkuReference: paymentResult.reference || null,
        duitkuVaNumber: paymentResult.vaNumber || null,
        duitkuQrString: paymentResult.qrString || null,
        // Midtrans GoPay/QRIS specific (Core API)
        qrCodeUrl: paymentResult.qrCodeUrl || null,
        qrString: paymentResult.qrString || null,
        midtransTransactionId: paymentResult.transactionId || null,
        // Transaction info - ALL VERIFIED FROM DATABASE
        totalTransactions: safeTransactions.length,
        totalAmount: subtotal,
        discountAmount: verifiedDiscountAmount,
        finalAmount: verifiedFinalAmountBeforeFee,
      },
    });
  } catch (paymentError) {
    console.error("Payment Gateway Error:", paymentError);

    // Delete created transactions if payment gateway fails
    const deletePromises = createdTransactions.map((t) =>
      Transaction.findByIdAndDelete(t._id),
    );
    await Promise.all(deletePromises);

    return NextResponse.json(
      { error: "Failed to create payment gateway. Please try again later." },
      { status: 500 },
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
    paymentFee, // Receive payment fee from frontend
    robloxUsername,
    robloxPassword,
    jokiDetails,
    robuxInstantDetails,
    rbx5Details,
    gamepassDetails,
    resellerDetails, // Add resellerDetails
    customerInfo,
    userId,
    gamepass,
    additionalNotes,
  } = body;

  // Normalize paymentMethodId: top-level takes priority, fallback to rbx5Details.paymentMethodId
  const paymentMethodId: string | undefined =
    body.paymentMethodId || rbx5Details?.paymentMethodId || undefined;

  // Use paymentMethodId as the payment method
  const paymentMethod = paymentMethodId;

  console.log("=== SINGLE ITEM TRANSACTION DEBUG ===");
  console.log("Extracted fields:", {
    serviceType,
    serviceId,
    serviceName,
    serviceCategory,
    quantity,
    unitPrice,
    totalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
    paymentFee,
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
  // Password hanya diperlukan untuk robux instant dan joki, tidak untuk gamepass, robux 5 hari, dan reseller
  let passwordRequired = false;
  let usernameRequired = true;

  // Reseller packages don't need Roblox credentials
  if (serviceType === "reseller") {
    usernameRequired = false;
    passwordRequired = false;
  } else if (serviceType === "robux") {
    // Untuk robux, cek kategori
    passwordRequired = serviceCategory === "robux_instant" && !robloxPassword;
  } else if (serviceType === "joki") {
    // Untuk joki, password selalu diperlukan
    passwordRequired = !robloxPassword;
  }
  // Untuk gamepass, password tidak diperlukan (passwordRequired tetap false)

  // unitPrice is NOT sent from frontend anymore - server computes it from DB.
  // We only keep this check for types where price lookup could fail without it
  // (currently unused - all types are validated server-side via validateSingleTransaction)
  const unitPriceRequired = false; // Server recalculates all prices from DB

  if (
    !serviceType ||
    !serviceId ||
    !serviceName ||
    !quantity ||
    (unitPriceRequired && !unitPrice) ||
    (usernameRequired && !robloxUsername) ||
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
      usernameRequired,
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
      { status: 400 },
    );
  }

  // Validasi customerInfo untuk guest checkout
  if (!userId && (!customerInfo || !customerInfo.name || !customerInfo.email)) {
    console.error("Guest checkout requires customer info:", customerInfo);
    return NextResponse.json(
      { error: "Customer information required for guest checkout" },
      { status: 400 },
    );
  }

  // ============================================================
  // Verifikasi Roblox username ke Roblox API (anti-spoof)
  // ============================================================
  let verifiedRobloxUsername = robloxUsername || "";
  let verifiedRobloxUserId: number | undefined;
  if (usernameRequired && robloxUsername) {
    const usernameVerification = await verifyRobloxUsername(robloxUsername);
    if (!usernameVerification.valid) {
      console.error(
        `❌ Roblox username verification failed: ${usernameVerification.error}`,
      );
      return NextResponse.json(
        {
          error:
            usernameVerification.error ||
            `Username Roblox "${robloxUsername}" tidak valid`,
        },
        { status: 400 },
      );
    }
    // Use verified username from Roblox (exact casing)
    verifiedRobloxUsername = usernameVerification.verifiedUsername!;
    verifiedRobloxUserId = usernameVerification.userId;
    console.log(
      `✅ Roblox username verified: "${robloxUsername}" → "${verifiedRobloxUsername}" (userId=${verifiedRobloxUserId})`,
    );
  }

  // ============================================================
  // SERVER-SIDE VALIDATION: Jangan percaya data dari frontend!
  // Hitung ulang semua harga, diskon, dan fee dari database.
  // ============================================================
  const validation = await validateSingleTransaction({
    ...body,
    paymentMethodId, // use normalized paymentMethodId (top-level or from rbx5Details)
  });

  if (!validation.valid) {
    console.error("❌ Server-side validation failed:", validation.error);
    return NextResponse.json(
      { error: validation.error || "Validasi harga gagal" },
      { status: 400 },
    );
  }

  const {
    unitPrice: verifiedUnitPrice,
    totalAmount: verifiedTotalAmount,
    discountPercentage: verifiedDiscountPercentage,
    discountAmount: verifiedDiscountAmount,
    finalAmountBeforeFee: verifiedFinalAmountBeforeFee,
    paymentFee: verifiedPaymentFee,
    finalAmountWithFee: verifiedFinalAmountWithFee,
    paymentMethodName,
    validPaymentMethodId,
    paymentMethodDoc,
    verifiedRobuxAmount,
    verifiedGamepassAmount,
    verifiedPricePerHundred,
    verifiedResellerDetails,
    verifiedServiceName,
    verifiedRobuxInstantDetails,
    verifiedGamepassDetails,
  } = validation.verified;

  console.log("✅ Server-side validation passed. Using verified values:");
  console.log({
    verifiedUnitPrice,
    verifiedTotalAmount,
    verifiedDiscountPercentage,
    verifiedDiscountAmount,
    verifiedFinalAmountBeforeFee,
    verifiedPaymentFee,
    verifiedFinalAmountWithFee,
  });

  // ============================================================
  // VERIFY GAMEPASS via Roblox API for rbx5_hari (anti-spoof)
  // ============================================================
  let verifiedRbx5Gamepass: any = null;
  if (
    serviceType === "robux" &&
    serviceCategory === "robux_5_hari" &&
    rbx5Details?.gamepass &&
    rbx5Details?.selectedPlace?.placeId
  ) {
    const expectedGamepassPrice =
      verifiedGamepassAmount || rbx5Details.gamepass.price;
    const robloxCheck = await verifyGamepassFromRoblox(
      rbx5Details.selectedPlace.placeId,
      expectedGamepassPrice,
    );
    if (!robloxCheck.valid || !robloxCheck.gamepass) {
      console.error("❌ Gamepass verification failed:", robloxCheck.error);
      return NextResponse.json(
        {
          error:
            robloxCheck.error ||
            "GamePass tidak valid. Pastikan GamePass sudah dibuat dengan benar dan harga sesuai.",
        },
        { status: 400 },
      );
    }
    verifiedRbx5Gamepass = robloxCheck.gamepass;
    console.log("✅ Gamepass verified from Roblox API:", verifiedRbx5Gamepass);

    // Cross-check: sellerId gamepass harus = userId dari robloxUsername
    if (verifiedRobloxUserId && verifiedRbx5Gamepass.sellerId) {
      if (verifiedRbx5Gamepass.sellerId !== verifiedRobloxUserId) {
        console.error(
          `❌ Seller ID mismatch! Gamepass sellerId=${verifiedRbx5Gamepass.sellerId}, but robloxUsername "${verifiedRobloxUsername}" has userId=${verifiedRobloxUserId}`,
        );
        return NextResponse.json(
          {
            error: `GamePass ini bukan milik akun "${verifiedRobloxUsername}". Pemilik GamePass tidak sesuai dengan username yang dimasukkan.`,
          },
          { status: 400 },
        );
      }
      console.log(
        `✅ Seller ID match: gamepass sellerId=${verifiedRbx5Gamepass.sellerId} === username userId=${verifiedRobloxUserId}`,
      );
    }
  }

  // Buat transaksi baru - GUNAKAN DATA TERVERIFIKASI DARI DATABASE
  const transactionData: any = {
    serviceType,
    serviceId,
    // For reseller, use verified name from DB to prevent spoofing
    serviceName: verifiedServiceName || serviceName,
    serviceImage,
    quantity,
    unitPrice: verifiedUnitPrice,
    totalAmount: verifiedTotalAmount,
    discountPercentage: verifiedDiscountPercentage,
    discountAmount: verifiedDiscountAmount,
    finalAmount: verifiedFinalAmountBeforeFee,
    robloxUsername: verifiedRobloxUsername, // Verified from Roblox API (empty for reseller)
    robloxPassword: robloxPassword || "", // Empty string for gamepass, robux_5_hari, and reseller
    customerNotes: additionalNotes || "", // Customer notes dari form checkout
    jokiDetails: serviceType === "joki" ? jokiDetails : undefined,
    // SANITIZE robuxInstantDetails: use verified data from DB, only allow notes from client
    robuxInstantDetails: verifiedRobuxInstantDetails
      ? {
          robuxAmount: verifiedRobuxInstantDetails.robuxAmount,
          productName: verifiedRobuxInstantDetails.productName,
          description: verifiedRobuxInstantDetails.description,
          notes: robuxInstantDetails?.notes || "",
          additionalInfo: robuxInstantDetails?.additionalInfo || "",
        }
      : undefined,
    // SANITIZE rbx5Details: ALL gamepass data from Roblox API, not client
    rbx5Details: rbx5Details
      ? {
          robuxAmount: verifiedRobuxAmount || rbx5Details.robuxAmount,
          gamepassAmount: verifiedGamepassAmount || rbx5Details.gamepassAmount,
          packageName: rbx5Details.packageName,
          selectedPlace: rbx5Details.selectedPlace
            ? {
                placeId: rbx5Details.selectedPlace.placeId,
                name: rbx5Details.selectedPlace.name,
              }
            : undefined,
          gamepassCreated: rbx5Details.gamepassCreated,
          gamepass: verifiedRbx5Gamepass
            ? {
                id: verifiedRbx5Gamepass.id,
                name: verifiedRbx5Gamepass.name,
                price: verifiedRbx5Gamepass.price,
                productId: verifiedRbx5Gamepass.productId,
                sellerId: verifiedRbx5Gamepass.sellerId,
              }
            : undefined,
          pricePerRobux: verifiedPricePerHundred
            ? verifiedPricePerHundred / 100
            : rbx5Details.pricePerRobux,
        }
      : undefined,
    gamepassDetails: verifiedGamepassDetails
      ? {
          gameName: verifiedGamepassDetails.gameName,
          itemName: verifiedGamepassDetails.itemName,
          gamepassId: verifiedGamepassDetails.gamepassId,
          additionalInfo: gamepassDetails?.additionalInfo || "",
        }
      : undefined,
    // SANITIZE resellerDetails: use verified data from DB, NOT from frontend
    resellerDetails: verifiedResellerDetails || undefined,
    paymentMethodId: validPaymentMethodId, // Use validated ObjectId or null
    paymentMethodName: paymentMethodName,
    customerInfo: {
      ...customerInfo,
      userId: userId || null, // Store userId in customerInfo
    },
  };

  // Tambahkan data gamepass untuk service robux_5_hari - USE VERIFIED FROM ROBLOX API
  if (
    serviceType === "robux" &&
    serviceCategory === "robux_5_hari" &&
    verifiedRbx5Gamepass
  ) {
    transactionData.gamepass = {
      id: verifiedRbx5Gamepass.id,
      name: verifiedRbx5Gamepass.name,
      price: verifiedRbx5Gamepass.price,
      productId: verifiedRbx5Gamepass.productId,
      sellerId: verifiedRbx5Gamepass.sellerId,
    };
  }

  console.log("=== Transaction Data Debug ===");
  console.log("Final userId for customerInfo:", userId || null);
  console.log("Final customerInfo:", {
    ...customerInfo,
    userId: userId || null,
  });
  console.log(
    "Final transactionData.customerInfo:",
    transactionData.customerInfo,
  );

  // Add serviceCategory for robux and reseller services
  if (
    (serviceType === "robux" || serviceType === "reseller") &&
    serviceCategory
  ) {
    transactionData.serviceCategory = serviceCategory;
  }

  const transaction = new Transaction(transactionData);

  console.log(
    "Transaction created with password:",
    robloxPassword ? "[PRESENT]" : "[EMPTY]",
  );

  // Generate Midtrans order ID
  const midtransOrderId = transaction.generateMidtransOrderId();

  // Calculate price after discount (WITHOUT payment fee) - USING VERIFIED VALUES
  const amountAfterDiscount = verifiedFinalAmountBeforeFee;
  const finalUnitPrice = Math.round(amountAfterDiscount / quantity);

  console.log("=== PRICE CALCULATION DEBUG (VERIFIED) ===");
  console.log("Total Amount (verified):", verifiedTotalAmount);
  console.log("Discount Amount (verified):", verifiedDiscountAmount);
  console.log("Amount After Discount (verified):", amountAfterDiscount);
  console.log("Quantity:", quantity);
  console.log("Final Unit Price:", finalUnitPrice);
  console.log("Payment Fee (verified):", verifiedPaymentFee);
  console.log("Final Amount With Fee (verified):", verifiedFinalAmountWithFee);

  const items = [
    {
      id: serviceId,
      price: finalUnitPrice, // Use unit price after discount (WITHOUT payment fee)
      quantity: quantity,
      name:
        verifiedDiscountPercentage > 0
          ? `${serviceName} (Diskon ${verifiedDiscountPercentage}%)`
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

  // Get active payment gateway from settings
  const settings = await Settings.getSiteSettings();
  const activeGateway = settings.activePaymentGateway || "midtrans";

  // Create payment gateway transaction
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    console.log("=== PAYMENT GATEWAY SELECTION (Single Item) ===");
    console.log("Active Payment Gateway:", activeGateway);
    console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
    console.log("Base URL used:", baseUrl);
    console.log("Payment method:", paymentMethod);

    // Calculate sum of items
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Use VERIFIED payment fee from database (not frontend)
    if (verifiedPaymentFee && verifiedPaymentFee > 0) {
      items.push({
        id: "PAYMENT_FEE",
        price: verifiedPaymentFee,
        quantity: 1,
        name: "Biaya Admin",
        brand: "RBX Store",
        category: "fee",
      });
    }

    // Calculate total items amount
    const totalItemsAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    console.log("=== SINGLE-ITEM PAYMENT DEBUG (VERIFIED) ===");
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Items total:", itemsTotal);
    console.log("Payment fee (verified from DB):", verifiedPaymentFee);
    console.log("Total items amount:", totalItemsAmount);

    // Generate order ID
    const orderId = transaction.generateMidtransOrderId();

    let paymentResult: {
      token?: string;
      redirect_url?: string;
      paymentUrl?: string;
      reference?: string;
      vaNumber?: string;
      qrString?: string;
    };

    if (activeGateway === "duitku") {
      // ===== DUITKU PAYMENT GATEWAY =====
      console.log("Using Duitku payment gateway");

      await duitkuService.initializeConfig();

      // Get Duitku payment code from PaymentMethod
      let duitkuPaymentCode = "VC"; // Default to credit card
      if (validPaymentMethodId) {
        try {
          const PaymentMethod = (await import("@/models/PaymentMethod"))
            .default;
          const paymentMethodDoc =
            await PaymentMethod.findById(validPaymentMethodId);
          if (paymentMethodDoc && paymentMethodDoc.duitkuCode) {
            duitkuPaymentCode = paymentMethodDoc.duitkuCode;
          }
        } catch (error) {
          console.error("Error fetching Duitku payment code:", error);
        }
      }

      console.log("Duitku payment code:", duitkuPaymentCode);

      // Build product details string
      const productDetails = `${serviceName} x${quantity}`;

      const duitkuResult = await duitkuService.createTransaction({
        orderId: orderId,
        amount: totalItemsAmount,
        paymentMethod: duitkuPaymentCode,
        productDetails: productDetails.substring(0, 255),
        customer: {
          firstName: customerInfo.name,
          email: customerInfo.email,
          phoneNumber: customerInfo.phone || "",
        },
        returnUrl: `${baseUrl}/transaction/?order_id=${orderId}`,
        callbackUrl: `${baseUrl}/api/transactions/webhook/duitku`,
      });

      paymentResult = {
        paymentUrl: duitkuResult.paymentUrl,
        reference: duitkuResult.reference,
        vaNumber: duitkuResult.vaNumber,
        qrString: duitkuResult.qrString,
      };

      // Update transaction with Duitku data
      transaction.paymentGateway = "duitku";
      transaction.duitkuOrderId = orderId;
      transaction.duitkuPaymentUrl = duitkuResult.paymentUrl;
      transaction.duitkuReference = duitkuResult.reference || "";
      transaction.duitkuVaNumber = duitkuResult.vaNumber || "";
      transaction.duitkuQrString = duitkuResult.qrString || "";
      transaction.redirectUrl = duitkuResult.paymentUrl;
    } else {
      // ===== MIDTRANS PAYMENT GATEWAY =====
      console.log("Using Midtrans payment gateway");

      const midtransService = new MidtransService();

      // Map payment method to Midtrans enabled_payments
      // MUST use the payment method code (e.g., "gopay", "bca_va"), NOT the ObjectId
      const paymentMethodCode =
        paymentMethodDoc?.code?.toLowerCase() || paymentMethod?.toLowerCase();
      const enabledPayments = paymentMethodCode
        ? MidtransService.mapPaymentMethodToMidtrans(paymentMethodCode)
        : undefined;

      console.log("Payment method code for Midtrans:", paymentMethodCode);
      console.log("Enabled payments for Midtrans:", enabledPayments);

      const snapResult = await midtransService.createSnapTransaction({
        orderId: orderId,
        amount: totalItemsAmount,
        items,
        customer,
        enabledPayments,
        expiryHours: 24,
        callbackUrls: {
          finish: `${baseUrl}/transaction/?order_id=${orderId}`,
          error: `${baseUrl}/transaction/?order_id=${orderId}`,
          pending: `${baseUrl}/transaction/?order_id=${orderId}`,
        },
      });

      paymentResult = {
        token: snapResult.token,
        redirect_url: snapResult.redirect_url,
      };

      // Update transaction with Midtrans data
      transaction.paymentGateway = "midtrans";
      transaction.snapToken = snapResult.token;
      transaction.redirectUrl = snapResult.redirect_url;
      transaction.midtransOrderId = orderId;
    }

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
            "Failed to send invoice email, but transaction was created",
          );
        }
      } else {
        console.warn("No customer email provided, skipping invoice email");
      }
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
    }

    // Discord notification removed from transaction creation
    // Notifications are now only sent when payment status changes to "settlement"

    // Sanitize transaction before returning - NEVER expose sensitive fields
    const safeTransaction = {
      _id: transaction._id,
      invoiceId: transaction.invoiceId,
      serviceType: transaction.serviceType,
      serviceCategory: transaction.serviceCategory,
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      discountPercentage: transaction.discountPercentage,
      discountAmount: transaction.discountAmount,
      finalAmount: transaction.finalAmount,
      status: transaction.status,
      paymentGateway: transaction.paymentGateway,
      paymentMethodName: transaction.paymentMethodName,
      robloxUsername: transaction.robloxUsername,
      customerInfo: transaction.customerInfo
        ? {
            name: transaction.customerInfo.name,
            email: transaction.customerInfo.email,
            phone: transaction.customerInfo.phone,
          }
        : undefined,
      createdAt: transaction.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: {
        transaction: safeTransaction,
        paymentGateway: activeGateway,
        // Midtrans specific
        // snapToken: paymentResult.token || null,
        // Common redirect URL
        redirectUrl:
          paymentResult.redirect_url || paymentResult.paymentUrl || null,
        // Duitku specific
        duitkuPaymentUrl: paymentResult.paymentUrl || null,
        duitkuReference: paymentResult.reference || null,
        duitkuVaNumber: paymentResult.vaNumber || null,
        duitkuQrString: paymentResult.qrString || null,
      },
    });
  } catch (paymentError) {
    console.error("Payment Gateway Error:", paymentError);
    return NextResponse.json(
      { error: "Failed to create payment gateway. Please try again later." },
      { status: 500 },
    );
  }
}
