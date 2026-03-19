import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Settings from "@/models/Settings";
import MidtransService from "@/lib/midtrans";
import { duitkuService } from "@/lib/duitku";
import EmailService from "@/lib/email";
import { authenticateToken } from "@/lib/auth";
import {
  validateMultiTransactionItem,
  getVerifiedDiscount,
  getVerifiedPaymentFee,
  verifyRobloxUsername,
  verifyGamepassFromRoblox,
} from "@/lib/serverValidation";

// POST - Buat multiple transaksi dari cart
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Auth check: require login OR valid guest checkout data
    const isGuestCheckout = !body.userId;
    if (!isGuestCheckout) {
      try {
        const user = await authenticateToken(request);
        if (user._id.toString() !== body.userId) {
          return NextResponse.json(
            { error: "Forbidden: userId tidak sesuai dengan token" },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Unauthorized: Token diperlukan untuk checkout" },
          { status: 401 },
        );
      }
    } else {
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

    const {
      items,
      customerInfo,
      userId,
      totalAmount,
      discountPercentage,
      discountAmount,
      finalAmount,
      paymentFee: rawPaymentFee, // Receive payment fee from frontend
      paymentMethodId,
      additionalNotes,
    } = body;

    // Ensure paymentFee is a number
    const paymentFee = rawPaymentFee ? Number(rawPaymentFee) : 0;

    console.log("=== REQUEST DATA DEBUG ===");
    console.log("Total Amount:", totalAmount);
    console.log("Discount Percentage:", discountPercentage);
    console.log("Discount Amount:", discountAmount);
    console.log("Final Amount:", finalAmount);
    console.log("Payment Fee (raw):", rawPaymentFee);
    console.log("Payment Fee (converted):", paymentFee);
    console.log("Payment Method ID:", paymentMethodId);

    // Validasi input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 },
      );
    }

    // CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
    // Karena ada automasi gamepass creation yang harus dijalankan per-transaction
    const rbx5Items = items.filter(
      (item) =>
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

    // ============================================================
    // SERVER-SIDE VALIDATION: Jangan percaya data frontend!
    // Validasi diskon dari DB
    // ============================================================
    const verifiedDiscount = await getVerifiedDiscount(userId);
    const verifiedDiscountPercentage = verifiedDiscount.discountPercentage;

    console.log(
      "✅ Verified discount from DB:",
      verifiedDiscountPercentage,
      "%",
    );
    if (
      discountPercentage &&
      discountPercentage !== verifiedDiscountPercentage
    ) {
      console.warn(
        `⚠️ DISCOUNT MISMATCH! Frontend: ${discountPercentage}%, DB: ${verifiedDiscountPercentage}%`,
      );
    }

    const createdTransactions = [];
    const midtransItems = [];
    console.log("Global discount percentage:", discountPercentage || 0);
    console.log("Global discount amount:", discountAmount || 0);

    // Process each item and create transactions - VALIDATE PRICES FROM DB
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      console.log(`Processing item ${i + 1}:`, item);

      // Validasi item
      // unitPrice is NOT required - server computes all prices from DB
      if (
        !item.serviceType ||
        !item.serviceId ||
        !item.serviceName ||
        !item.quantity
      ) {
        console.error(`Invalid item at index ${i}:`, item);
        continue; // Skip invalid items
      }

      // Validasi username — reseller tidak perlu username Roblox
      const usernameRequiredForItem = item.serviceType !== "reseller";
      if (usernameRequiredForItem && !item.robloxUsername) {
        console.error(`Missing robloxUsername for item ${i}:`, item);
        return NextResponse.json(
          {
            error: `Roblox username is required for item: ${item.serviceName}`,
          },
          { status: 400 },
        );
      }

      // Verifikasi username ke Roblox API (anti-spoof)
      if (usernameRequiredForItem && item.robloxUsername) {
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
        item._verifiedRobloxUserId = usernameVerification.userId;
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
      const verifiedItemQuantity = itemValidation.verifiedQuantity; // Server-verified quantity

      console.log(
        `✅ Item ${i + 1} price verified: frontend=${item.unitPrice}, DB=${verifiedItemUnitPrice}, quantity=${verifiedItemQuantity}`,
      );

      // Prepare transaction data - GUNAKAN HARGA TERVERIFIKASI
      const transactionData: any = {
        serviceType: item.serviceType,
        serviceId: item.serviceId,
        // Use verified name from DB: robux_instant from Product DB, gamepass from Gamepass DB, others from client
        serviceName:
          itemValidation.verifiedRobuxInstantDetails?.productName ||
          itemValidation.verifiedGamepassDetails?.serviceName ||
          item.serviceName,
        // Use verified image from DB for gamepass, fallback to client for other types
        serviceImage:
          itemValidation.verifiedGamepassDetails?.serviceImage ||
          item.serviceImage ||
          null,
        quantity: verifiedItemQuantity, // Server-verified quantity
        unitPrice: verifiedItemUnitPrice,
        totalAmount: verifiedItemTotalAmount,
        discountPercentage: 0, // Will be updated after subtotal calculation
        discountAmount: 0,
        finalAmount: verifiedItemTotalAmount,
        robloxUsername: item.robloxUsername,
        robloxPassword: item.robloxPassword || "",
        customerNotes: additionalNotes || "",
        paymentMethodId: null, // Will be set after payment method validation
        paymentMethodName: null,
        customerInfo: {
          ...customerInfo,
          userId: userId || null,
        },
      };

      // Add service-specific details
      if (item.serviceCategory) {
        transactionData.serviceCategory = item.serviceCategory;
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
          if (item._verifiedRobloxUserId && verifiedGamepass.sellerId) {
            if (verifiedGamepass.sellerId !== item._verifiedRobloxUserId) {
              console.error(
                `❌ Item ${i + 1} seller ID mismatch! sellerId=${verifiedGamepass.sellerId}, userId=${item._verifiedRobloxUserId}`,
              );
              return NextResponse.json(
                {
                  error: `GamePass item ${i + 1} bukan milik akun "${item.robloxUsername}". Pemilik GamePass tidak sesuai dengan username yang dimasukkan.`,
                },
                { status: 400 },
              );
            }
            console.log(
              `✅ Item ${i + 1} seller ID match: sellerId=${verifiedGamepass.sellerId} === userId=${item._verifiedRobloxUserId}`,
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

      // Create transaction
      const transaction = new Transaction(transactionData);
      await transaction.save();

      createdTransactions.push(transaction);

      // Prepare Midtrans item with VERIFIED price (discount applied below)
      midtransItems.push({
        id: `${item.serviceId}-${i}`,
        price: verifiedItemUnitPrice,
        quantity: verifiedItemQuantity, // Server-verified quantity
        name: item.serviceName,
        brand: "RBX Store",
        category: item.serviceType,
      });

      console.log(`Transaction created: ${transaction.invoiceId}`);
    }

    if (createdTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions could be created" },
        { status: 400 },
      );
    }

    // ============================================================
    // SERVER-SIDE: Hitung ulang total, diskon, dan fee dari DB
    // ============================================================
    const subtotal = createdTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0,
    );

    // Hitung diskon dari DB (BUKAN dari frontend)
    const verifiedDiscountAmount = Math.round(
      (subtotal * verifiedDiscountPercentage) / 100,
    );
    const verifiedFinalAmountBeforeFee = subtotal - verifiedDiscountAmount;

    console.log("=== TOTALS CALCULATION (VERIFIED) ===");
    console.log("Subtotal (verified):", subtotal);
    console.log("Discount % (verified from DB):", verifiedDiscountPercentage);
    console.log("Discount Amount (calculated):", verifiedDiscountAmount);
    console.log(
      "Final amount before fee (verified):",
      verifiedFinalAmountBeforeFee,
    );

    // Update transactions with VERIFIED proportional discount
    if (verifiedDiscountAmount > 0 && createdTransactions.length > 0) {
      for (const transaction of createdTransactions) {
        const itemRatio = transaction.totalAmount / subtotal;
        const itemDiscountAmount = Math.round(
          verifiedDiscountAmount * itemRatio,
        );
        const itemFinalAmount = transaction.totalAmount - itemDiscountAmount;

        transaction.discountPercentage = verifiedDiscountPercentage;
        transaction.discountAmount = itemDiscountAmount;
        transaction.finalAmount = itemFinalAmount;
        await transaction.save();
      }
    }

    // Validasi & hitung payment fee dari DB (BUKAN dari frontend)
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

    // Update payment method info on all transactions
    if (paymentMethodName || validPaymentMethodId) {
      for (const transaction of createdTransactions) {
        if (paymentMethodName)
          transaction.paymentMethodName = paymentMethodName;
        if (validPaymentMethodId)
          transaction.paymentMethodId = validPaymentMethodId;
      }
    }

    // Apply VERIFIED discount to Midtrans items
    if (verifiedDiscountAmount > 0 && midtransItems.length > 0) {
      const discountMultiplier = 1 - verifiedDiscountPercentage / 100;
      midtransItems.forEach((item) => {
        const originalPrice = item.price;
        item.price = Math.round(item.price * discountMultiplier);
        if (!item.name.includes("Diskon")) {
          item.name = `${item.name} (Diskon ${verifiedDiscountPercentage}%)`;
        }
        console.log(
          `Item: ${item.name}, Original: ${originalPrice}, Discounted: ${item.price}`,
        );
      });
    }

    // Create a master order ID for grouping BEFORE saving transactions
    const masterOrderId = `MULTI-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    console.log("=== MASTER ORDER ID CREATED ===");
    console.log("Master Order ID:", masterOrderId);

    // NOW set midtransOrderId for all transactions BEFORE payment gateway call
    createdTransactions.forEach((transaction) => {
      transaction.midtransOrderId = masterOrderId;
    });

    // Get active payment gateway from settings
    const settings = await Settings.getSiteSettings();
    const activeGateway = settings.activePaymentGateway || "midtrans";

    console.log("=== PAYMENT GATEWAY SELECTION (Multi) ===");
    console.log("Active Payment Gateway:", activeGateway);

    // Create payment gateway transaction
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      // Calculate sum of items with discount already applied to unit prices
      const itemsTotal = midtransItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Store VERIFIED payment fee in FIRST transaction only
      if (createdTransactions.length > 0 && verifiedPaymentFee > 0) {
        createdTransactions[0].paymentFee = verifiedPaymentFee;
        await createdTransactions[0].save();
        console.log(
          `Verified payment fee (${verifiedPaymentFee}) saved to first transaction: ${createdTransactions[0].invoiceId}`,
        );
      }

      // Add VERIFIED payment fee to items if applicable
      if (verifiedPaymentFee > 0) {
        midtransItems.push({
          id: "PAYMENT_FEE",
          price: verifiedPaymentFee,
          quantity: 1,
          name: "Biaya Admin",
          brand: "RBX Store",
          category: "fee",
        });
        console.log(
          `✅ Verified payment fee added to items: ${verifiedPaymentFee}`,
        );
      }

      // Calculate gross_amount from sum of item_details
      const grossAmount = midtransItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      console.log("=== MULTI-CHECKOUT PAYMENT DEBUG (VERIFIED) ===");
      console.log("Items:", JSON.stringify(midtransItems, null, 2));
      console.log("Items total (with discount):", itemsTotal);
      console.log("Payment fee (verified):", verifiedPaymentFee);
      console.log("Gross amount:", grossAmount);
      console.log("Payment method ID:", paymentMethodId);

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
        const productDetails = midtransItems
          .filter((item) => item.category !== "fee")
          .map((item) => `${item.name} x${item.quantity}`)
          .join(", ");

        const duitkuResult = await duitkuService.createTransaction({
          orderId: masterOrderId,
          amount: grossAmount,
          paymentMethod: duitkuPaymentCode,
          productDetails: productDetails.substring(0, 255),
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
        const updatePromises = createdTransactions.map(async (transaction) => {
          transaction.paymentGateway = "duitku";
          transaction.duitkuOrderId = masterOrderId;
          transaction.duitkuPaymentUrl = duitkuResult.paymentUrl;
          transaction.duitkuReference = duitkuResult.reference || "";
          transaction.duitkuVaNumber = duitkuResult.vaNumber || "";
          transaction.duitkuQrString = duitkuResult.qrString || "";
          transaction.redirectUrl = duitkuResult.paymentUrl;
          await transaction.save();
        });

        await Promise.all(updatePromises);

        console.log(`All transactions updated with Duitku data`);
      } else {
        // ===== MIDTRANS PAYMENT GATEWAY =====
        console.log("Using Midtrans payment gateway");

        const midtransService = new MidtransService();

        // Map payment method to Midtrans enabled_payments
        // MUST use payment method code (e.g., "gopay", "bca_va"), NOT ObjectId
        const paymentMethodCode =
          paymentMethodDoc?.code?.toLowerCase() ||
          paymentMethodId?.toLowerCase();
        const enabledPayments = paymentMethodCode
          ? MidtransService.mapPaymentMethodToMidtrans(paymentMethodCode)
          : undefined;

        console.log("Payment method code for Midtrans:", paymentMethodCode);
        console.log("Enabled payments for Midtrans:", enabledPayments);

        const snapResult = await midtransService.createSnapTransaction({
          orderId: masterOrderId,
          amount: grossAmount,
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

        paymentResult = {
          token: snapResult.token,
          redirect_url: snapResult.redirect_url,
        };

        // Update all transactions with Midtrans data
        const updatePromises = createdTransactions.map(async (transaction) => {
          transaction.paymentGateway = "midtrans";
          transaction.snapToken = snapResult.token;
          transaction.redirectUrl = snapResult.redirect_url;
          await transaction.save();
        });

        await Promise.all(updatePromises);

        console.log(`All transactions updated with Midtrans data`);
      }

      // Send invoice email with all transactions for multi-checkout
      try {
        if (customerInfo.email) {
          console.log("Sending invoice email to:", customerInfo.email);
          console.log(
            "Number of transactions in invoice:",
            createdTransactions.length,
          );

          const emailSent =
            await EmailService.sendInvoiceEmail(createdTransactions);

          if (emailSent) {
            console.log("Multi-checkout invoice email sent successfully");
          } else {
            console.warn(
              "Failed to send invoice email, but transactions were created",
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
      }

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
          // Common redirect URL
          redirectUrl:
            paymentResult.redirect_url || paymentResult.paymentUrl || null,
          // Duitku specific
          duitkuPaymentUrl: paymentResult.paymentUrl || null,
          duitkuReference: paymentResult.reference || null,
          duitkuVaNumber: paymentResult.vaNumber || null,
          duitkuQrString: paymentResult.qrString || null,
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
  } catch (error) {
    console.error("Error creating multi transactions:", error);
    return NextResponse.json(
      { error: "Failed to create transactions" },
      { status: 500 },
    );
  }
}
