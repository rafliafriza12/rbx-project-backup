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
      paymentMethodId,
      additionalNotes,
    } = body;

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

    // Calculate payment method fee
    let paymentMethodFee = 0;
    if (paymentMethodId) {
      // You can add logic to fetch payment method and calculate fee
      // For now, we'll include it in the final calculation
    }

    const createdTransactions = [];
    const midtransItems = [];

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
        discountPercentage: 0, // Individual items don't have discount in multi-checkout
        discountAmount: 0,
        finalAmount: itemTotalAmount,
        robloxUsername: item.robloxUsername,
        robloxPassword: item.robloxPassword || "",
        customerNotes: additionalNotes || "", // Customer notes dari form checkout
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
        { error: "No valid transactions could be created" },
        { status: 400 }
      );
    }

    // Calculate final amount with discount and payment fee
    const subtotal =
      totalAmount ||
      createdTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const discount = discountAmount || 0;
    const finalAmountBeforeFee = finalAmount || subtotal - discount;

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
      const paymentFee = Math.round(finalAmountBeforeFee) - itemsTotal;

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

      console.log("=== MIDTRANS ITEMS DEBUG ===");
      console.log("Items:", JSON.stringify(midtransItems, null, 2));
      console.log("Items subtotal:", itemsSubtotal);
      console.log("Items with discount:", itemsTotal);
      console.log("Payment fee:", paymentFee);
      console.log("Final Amount:", finalAmountBeforeFee);
      console.log("Payment method ID:", paymentMethodId);

      // Map payment method to Midtrans enabled_payments
      const enabledPayments = paymentMethodId
        ? MidtransService.mapPaymentMethodToMidtrans(paymentMethodId)
        : undefined;

      console.log("Enabled payments for Midtrans:", enabledPayments);

      const snapResult = await midtransService.createSnapTransaction({
        orderId: masterOrderId,
        amount: Math.round(finalAmountBeforeFee),
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
          discountAmount: discount,
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
