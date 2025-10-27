import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import MidtransService from "@/lib/midtrans";
import EmailService from "@/lib/email";

// POST - Buat multiple transaksi dari cart
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log("=== MULTI TRANSACTION API DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));

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
        { status: 400 }
      );
    }

    // CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
    // Karena ada automasi gamepass creation yang harus dijalankan per-transaction
    const rbx5Items = items.filter(
      (item) =>
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

    // Validate and fetch payment method
    let paymentMethodFee = 0;
    let validPaymentMethodId = null;
    let paymentMethodName = null;

    if (paymentMethodId) {
      try {
        const PaymentMethod = (await import("@/models/PaymentMethod")).default;
        const mongoose = await import("mongoose");

        // Check if paymentMethodId is a valid ObjectId string
        if (mongoose.default.Types.ObjectId.isValid(paymentMethodId)) {
          // It's already a valid ObjectId, use it directly
          validPaymentMethodId = paymentMethodId;
          const paymentMethodDoc = await PaymentMethod.findById(
            paymentMethodId
          );
          if (paymentMethodDoc) {
            paymentMethodName = paymentMethodDoc.name;
            // You can add fee calculation here if needed
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
            // You can add fee calculation here if needed
          } else {
            console.warn(
              `Payment method not found for code: ${paymentMethodId}`
            );
            validPaymentMethodId = null;
          }
        }
      } catch (error) {
        console.error("Error fetching payment method:", error);
        validPaymentMethodId = null;
      }
    }

    const createdTransactions = [];
    const midtransItems = [];

    // Calculate subtotal from all items first - ALWAYS recalculate from quantity × unitPrice
    const subtotalFromItems = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    console.log("=== DISCOUNT DISTRIBUTION DEBUG ===");
    console.log("Subtotal from items (recalculated):", subtotalFromItems);
    console.log("Global discount percentage:", discountPercentage || 0);
    console.log("Global discount amount:", discountAmount || 0);

    // Process each item and create transactions
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
        continue; // Skip invalid items
      }

      // Validasi username
      if (!item.robloxUsername) {
        console.error(`Missing robloxUsername for item ${i}:`, item);
        return NextResponse.json(
          {
            error: `Roblox username is required for item: ${item.serviceName}`,
          },
          { status: 400 }
        );
      }

      // Calculate amounts for this item
      // ALWAYS recalculate from quantity × unitPrice (don't trust frontend)
      const itemTotalAmount = item.quantity * item.unitPrice;

      console.log(`Item ${i + 1} calculation:`, {
        name: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        calculatedTotal: itemTotalAmount,
        frontendTotal: item.totalAmount,
        match: itemTotalAmount === item.totalAmount,
      });

      // Distribute global discount proportionally to this item
      let itemDiscountAmount = 0;
      let itemDiscountPercentage = 0;
      let itemFinalAmount = itemTotalAmount;

      if (discountAmount && discountAmount > 0 && subtotalFromItems > 0) {
        // Calculate proportional discount for this item
        const itemRatio = itemTotalAmount / subtotalFromItems;
        itemDiscountAmount = Math.round(discountAmount * itemRatio);
        itemDiscountPercentage = discountPercentage || 0;
        itemFinalAmount = itemTotalAmount - itemDiscountAmount;

        console.log(`Item ${i + 1} discount distribution:`);
        console.log(`  - Item total: ${itemTotalAmount}`);
        console.log(`  - Item ratio: ${itemRatio.toFixed(4)}`);
        console.log(`  - Item discount: ${itemDiscountAmount}`);
        console.log(`  - Item final amount: ${itemFinalAmount}`);
      }

      // Prepare transaction data
      const transactionData: any = {
        serviceType: item.serviceType,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        serviceImage: item.serviceImage || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: itemTotalAmount,
        discountPercentage: itemDiscountPercentage,
        discountAmount: itemDiscountAmount,
        finalAmount: itemFinalAmount,
        robloxUsername: item.robloxUsername,
        robloxPassword: item.robloxPassword || "",
        customerNotes: additionalNotes || "",
        paymentMethodId: validPaymentMethodId, // Use validated ObjectId or null
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

      if (item.jokiDetails) {
        transactionData.jokiDetails = item.jokiDetails;
      }

      if (item.robuxInstantDetails) {
        transactionData.robuxInstantDetails = item.robuxInstantDetails;
      }

      if (item.rbx5Details) {
        transactionData.rbx5Details = item.rbx5Details;

        // Extract gamepass data if available
        if (item.rbx5Details.gamepass) {
          transactionData.gamepass = item.rbx5Details.gamepass;
        }
      }

      if (item.gamepassDetails) {
        transactionData.gamepassDetails = item.gamepassDetails;
      }

      // Create transaction
      const transaction = new Transaction(transactionData);
      await transaction.save();

      createdTransactions.push(transaction);

      // Prepare Midtrans item with discount applied to unit price
      const itemUnitPriceAfterDiscount =
        itemDiscountAmount > 0
          ? Math.round(itemFinalAmount / item.quantity)
          : item.unitPrice;

      const itemNameWithDiscount =
        itemDiscountPercentage > 0
          ? `${item.serviceName} (Diskon ${itemDiscountPercentage}%)`
          : item.serviceName;

      midtransItems.push({
        id: `${item.serviceId}-${i}`,
        price: itemUnitPriceAfterDiscount,
        quantity: item.quantity,
        name: itemNameWithDiscount,
        brand: "RBX Store",
        category: item.serviceType,
      });

      console.log(`Transaction created: ${transaction.invoiceId}`);
      console.log(
        `  - Midtrans item price: ${itemUnitPriceAfterDiscount} (discount applied: ${itemDiscountAmount})`
      );
    }

    if (createdTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions could be created" },
        { status: 400 }
      );
    }

    // Calculate totals from created transactions (discount already distributed)
    const subtotal = createdTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const totalDiscountDistributed = createdTransactions.reduce(
      (sum, t) => sum + (t.discountAmount || 0),
      0
    );
    const finalAmountBeforeFee = createdTransactions.reduce(
      (sum, t) => sum + t.finalAmount,
      0
    );

    console.log("=== TOTALS CALCULATION DEBUG ===");
    console.log("Subtotal from transactions:", subtotal);
    console.log("Total discount distributed:", totalDiscountDistributed);
    console.log("Final amount (before fee):", finalAmountBeforeFee);
    console.log(
      "Expected final amount from request:",
      finalAmount || "not provided"
    );

    // Create a master order ID for grouping BEFORE saving transactions
    const masterOrderId = `MULTI-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    console.log("=== MASTER ORDER ID CREATED ===");
    console.log("Master Order ID:", masterOrderId);

    // NOW set midtransOrderId for all transactions BEFORE Midtrans call
    createdTransactions.forEach((transaction) => {
      transaction.midtransOrderId = masterOrderId;
    });

    // Create Midtrans Snap transaction for all items
    try {
      const midtransService = new MidtransService();
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      // Calculate sum of items with discount already applied to unit prices
      const itemsTotal = midtransItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      console.log("=== PAYMENT FEE FROM REQUEST ===");
      console.log("Payment Fee (from frontend):", paymentFee);
      console.log("Payment Fee Type:", typeof paymentFee);
      console.log("Items Total (after discount):", itemsTotal);

      // Store payment fee in FIRST transaction only
      if (createdTransactions.length > 0 && paymentFee > 0) {
        createdTransactions[0].paymentFee = paymentFee;
        await createdTransactions[0].save();
        console.log(
          `Payment fee (${paymentFee}) saved to first transaction: ${createdTransactions[0].invoiceId}`
        );
      }

      // Add payment fee to Midtrans items if applicable
      if (paymentFee && paymentFee > 0) {
        midtransItems.push({
          id: "PAYMENT_FEE",
          price: paymentFee,
          quantity: 1,
          name: "Biaya Admin",
          brand: "RBX Store",
          category: "fee",
        });
        console.log(`✅ Payment fee added to Midtrans items: ${paymentFee}`);
      } else {
        console.log(`❌ Payment fee NOT added (value: ${paymentFee})`);
      }

      console.log("=== MIDTRANS ITEMS DEBUG ===");
      console.log("Items:", JSON.stringify(midtransItems, null, 2));
      console.log("Items total (with discount):", itemsTotal);
      console.log("Payment fee:", paymentFee);
      console.log("Subtotal from transactions:", subtotal);
      console.log("Total discount distributed:", totalDiscountDistributed);
      console.log("Payment method ID:", paymentMethodId);

      // Map payment method to Midtrans enabled_payments
      const enabledPayments = paymentMethodId
        ? MidtransService.mapPaymentMethodToMidtrans(paymentMethodId)
        : undefined;

      console.log("Enabled payments for Midtrans:", enabledPayments);

      // Calculate gross_amount from sum of item_details (Midtrans requirement)
      const grossAmount = midtransItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      console.log("=== MIDTRANS GROSS AMOUNT ===");
      console.log("Calculated from items:", grossAmount);
      console.log("Items count:", midtransItems.length);

      const snapResult = await midtransService.createSnapTransaction({
        orderId: masterOrderId,
        amount: grossAmount, // Use calculated gross_amount instead of finalAmountBeforeFee
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

      console.log(`All transactions updated with Midtrans data`);

      // Send invoice email with all transactions for multi-checkout
      try {
        if (customerInfo.email) {
          console.log("Sending invoice email to:", customerInfo.email);
          console.log(
            "Number of transactions in invoice:",
            createdTransactions.length
          );

          // Send email with all transactions (multi-checkout invoice)
          const emailSent = await EmailService.sendInvoiceEmail(
            createdTransactions // Pass array of all transactions
          );

          if (emailSent) {
            console.log("Multi-checkout invoice email sent successfully");
          } else {
            console.warn(
              "Failed to send invoice email, but transactions were created"
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
        // Don't fail the transactions if email fails
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
          discountAmount: totalDiscountDistributed,
          finalAmount: finalAmountBeforeFee,
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
  } catch (error) {
    console.error("Error creating multi transactions:", error);
    return NextResponse.json(
      { error: "Failed to create transactions" },
      { status: 500 }
    );
  }
}
