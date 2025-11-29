import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import StockAccount from "@/models/StockAccount";
import ResellerPackage from "@/models/ResellerPackage";
import { duitkuService } from "@/lib/duitku";
import EmailService from "@/lib/email";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { PUT as updateStockAccountHandler } from "@/app/api/admin/stock-accounts/[id]/route";

// Activate reseller package for user after payment settlement
async function activateResellerPackage(transaction: any) {
  try {
    if (!transaction.customerInfo?.userId || !transaction.serviceId) {
      console.log("Missing userId or serviceId for reseller activation");
      return null;
    }

    const user = await User.findById(transaction.customerInfo.userId);
    if (!user) {
      console.log("User not found for reseller activation");
      return null;
    }

    const resellerPackage = await ResellerPackage.findById(
      transaction.serviceId
    );
    if (!resellerPackage) {
      console.log("Reseller package not found:", transaction.serviceId);
      return null;
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + resellerPackage.duration);

    // Update user with reseller info
    const previousTier = user.resellerTier || 0;
    user.resellerTier = resellerPackage.tier;
    user.resellerExpiry = expiryDate;
    user.resellerPackageId = resellerPackage._id;
    await user.save();

    console.log(
      `✅ Reseller activated for user ${user.email}: Tier ${
        resellerPackage.tier
      } (${resellerPackage.name}), Expires: ${expiryDate.toLocaleDateString(
        "id-ID"
      )}`
    );

    return {
      previousTier,
      newTier: resellerPackage.tier,
      packageName: resellerPackage.name,
      discount: resellerPackage.discount,
      expiryDate,
    };
  } catch (error) {
    console.error("Error in activateResellerPackage:", error);
    return null;
  }
}

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    console.log(
      "Processing gamepass purchase for transaction:",
      transaction.invoiceId
    );
    console.log("Gamepass data:", transaction.gamepass);

    const gamepassPrice = transaction.gamepass.price;

    // Cari akun yang memiliki robux sama atau lebih dari price gamepass
    const suitableAccount = await StockAccount.findOne({
      robux: { $gte: gamepassPrice },
      status: "active",
    }).sort({ robux: 1 });

    if (!suitableAccount) {
      console.log("No suitable account found for gamepass purchase");
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    console.log("Suitable account found:", suitableAccount.username);

    // Validate dan update account data terlebih dahulu
    console.log("🔄 Updating stock account data...");
    const updateRequest = new NextRequest(
      `${apiUrl}/api/admin/stock-accounts/${suitableAccount._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
        }),
      }
    );

    const updateAccountResponse = await updateStockAccountHandler(
      updateRequest,
      { params: Promise.resolve({ id: suitableAccount._id.toString() }) }
    );

    if (!updateAccountResponse.ok) {
      console.error("Failed to update account data");
      await transaction.updateStatus(
        "order",
        "pending",
        "Pesanan sedang diproses",
        null
      );
      return;
    }

    const updatedAccountData = await updateAccountResponse.json();

    if (!updatedAccountData.success) {
      console.error("Account validation failed:", updatedAccountData.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    // Cek apakah robux masih mencukupi setelah update
    if (updatedAccountData.stockAccount.robux < gamepassPrice) {
      console.log("Account robux insufficient after update");
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    // Lakukan purchase gamepass (using direct import with Puppeteer)
    console.log("🎯 Purchasing gamepass via Puppeteer...");
    const purchaseRequest = new NextRequest(`${apiUrl}/api/buy-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robloxCookie: suitableAccount.robloxCookie,
        productId: transaction.gamepass.productId,
        productName: transaction.gamepass.name,
        price: transaction.gamepass.price,
        sellerId: transaction.gamepass.sellerId,
      }),
    });

    const purchaseResponse = await buyPassHandler(purchaseRequest);
    const purchaseResult = await purchaseResponse.json();

    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
        null
      );

      // Update account data setelah purchase
      console.log("🔄 Updating stock account after purchase...");
      const postUpdateRequest = new NextRequest(
        `${apiUrl}/api/admin/stock-accounts/${suitableAccount._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            robloxCookie: suitableAccount.robloxCookie,
          }),
        }
      );

      await updateStockAccountHandler(postUpdateRequest, {
        params: Promise.resolve({ id: suitableAccount._id.toString() }),
      });
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
    }
  } catch (error) {
    console.error("Error in processGamepassPurchase:", error);
    await transaction.updateStatus(
      "order",
      "failed",
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      null
    );
  }
}

// Function to send email notification
async function sendPaymentNotification(transaction: any, status: string) {
  try {
    if (status === "settlement" && transaction.customerInfo?.email) {
      await EmailService.sendInvoiceEmail(transaction);
      console.log(`Invoice email sent to ${transaction.customerInfo.email}`);
    }
  } catch (error) {
    console.error("Error sending payment notification email:", error);
    // Don't fail the webhook if email fails
  }
}

/**
 * Duitku Webhook Handler
 * Endpoint: POST /api/transactions/webhook/duitku
 *
 * Duitku will send callback with the following payload:
 * - merchantCode: Merchant code
 * - amount: Transaction amount
 * - merchantOrderId: Our order ID
 * - productDetail: Product description
 * - additionalParam: Additional parameters (if any)
 * - paymentCode: Payment code used
 * - resultCode: Transaction result (00=Success, 01=Pending, 02=Cancelled/Failed)
 * - merchantUserId: User ID (if provided)
 * - reference: Duitku reference number
 * - signature: MD5 signature for verification
 * - publisherOrderId: Publisher order ID
 * - spUserHash: SP user hash (if applicable)
 * - settlementDate: Settlement date (if applicable)
 * - issuerCode: Issuer code (if applicable)
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse callback data
    const callbackData = await request.json();

    console.log(
      "📥 Duitku Webhook received:",
      JSON.stringify(callbackData, null, 2)
    );

    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      paymentCode,
      resultCode,
      reference,
      signature,
      settlementDate,
    } = callbackData;

    // Validate required fields
    if (!merchantOrderId || !resultCode || !signature) {
      console.error("Missing required fields in Duitku callback");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Duitku service and verify signature
    await duitkuService.initializeConfig();

    const isValidSignature = await duitkuService.verifyCallbackSignature(
      merchantCode,
      amount,
      merchantOrderId,
      signature
    );

    if (!isValidSignature) {
      console.error("Invalid signature from Duitku webhook");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Duitku signature verified successfully");

    // Find all transactions with this order ID
    const transactions = await Transaction.find({
      duitkuOrderId: merchantOrderId,
    });

    if (!transactions || transactions.length === 0) {
      // Try to find by midtransOrderId as fallback (same field might be used)
      const fallbackTransactions = await Transaction.find({
        midtransOrderId: merchantOrderId,
      });

      if (!fallbackTransactions || fallbackTransactions.length === 0) {
        console.error("Transaction not found for order_id:", merchantOrderId);
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
    }

    const targetTransactions =
      transactions.length > 0
        ? transactions
        : await Transaction.find({ midtransOrderId: merchantOrderId });

    console.log(
      `Found ${targetTransactions.length} transaction(s) with order_id: ${merchantOrderId}`
    );

    // Update Duitku reference for all transactions
    const updateReferencePromises = targetTransactions
      .filter((t) => reference && !t.duitkuReference)
      .map((t) => {
        t.duitkuReference = reference;
        return t.save();
      });

    await Promise.all(updateReferencePromises);

    // Map Duitku status to application status
    const statusMapping = duitkuService.mapDuitkuStatus(resultCode);

    // Process each transaction
    const updatedTransactions = [];
    const rbx5TransactionsToProcess = [];

    for (const transaction of targetTransactions) {
      const previousPaymentStatus = transaction.paymentStatus;
      const previousOrderStatus = transaction.orderStatus;

      // Update payment status jika berubah
      if (transaction.paymentStatus !== statusMapping.paymentStatus) {
        const statusMessage = settlementDate
          ? `Payment ${statusMapping.paymentStatus} via Duitku (${paymentCode}). Reference: ${reference}. Settlement: ${settlementDate}`
          : `Payment ${statusMapping.paymentStatus} via Duitku (${paymentCode}). Reference: ${reference}`;

        await transaction.updateStatus(
          "payment",
          statusMapping.paymentStatus,
          statusMessage,
          null
        );

        // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.customerInfo?.userId
        ) {
          try {
            // Update spendedMoney user (hanya sekali per user per order)
            const isFirstTransaction =
              targetTransactions.findIndex((t) =>
                t._id.equals(transaction._id)
              ) === 0;

            if (isFirstTransaction) {
              const user = await User.findById(transaction.customerInfo.userId);
              if (user) {
                const totalOrderAmount = targetTransactions.reduce(
                  (sum, t) => sum + (t.finalAmount || t.totalAmount),
                  0
                );

                user.spendedMoney += totalOrderAmount;
                await user.save();

                console.log(
                  `Updated spendedMoney for user ${user.email}: +${totalOrderAmount} (total: ${user.spendedMoney})`
                );
              }
            }
          } catch (userUpdateError) {
            console.error("Error updating user spendedMoney:", userUpdateError);
          }
        }

        // Activate reseller package if this is a reseller purchase
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.serviceType === "reseller_package"
        ) {
          const resellerResult = await activateResellerPackage(transaction);
          if (resellerResult) {
            console.log("Reseller package activated:", resellerResult);
          }
        }

        // Check if this is a robux_5_hari transaction that needs processing
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.serviceType === "robux_5_hari" &&
          transaction.gamepass
        ) {
          rbx5TransactionsToProcess.push(transaction);
        }

        // Send email notification
        await sendPaymentNotification(transaction, statusMapping.paymentStatus);
      }

      // Update order status jika ada dan berubah
      if (
        statusMapping.orderStatus &&
        transaction.orderStatus !== statusMapping.orderStatus
      ) {
        await transaction.updateStatus(
          "order",
          statusMapping.orderStatus,
          `Order status updated from Duitku callback`,
          null
        );
      }

      updatedTransactions.push({
        invoiceId: transaction.invoiceId,
        previousStatus: previousPaymentStatus,
        newStatus: statusMapping.paymentStatus,
        orderStatus: transaction.orderStatus,
      });
    }

    // Process robux_5_hari transactions sequentially
    for (const transaction of rbx5TransactionsToProcess) {
      console.log(
        `Processing robux_5_hari transaction: ${transaction.invoiceId}`
      );
      await processGamepassPurchase(transaction);
    }

    console.log("✅ Duitku Webhook processed successfully:", {
      merchantOrderId,
      resultCode,
      reference,
      transactionsUpdated: updatedTransactions.length,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        merchantOrderId,
        resultCode,
        reference,
        statusMapping,
        transactionsUpdated: updatedTransactions,
      },
    });
  } catch (error) {
    console.error("Error in Duitku webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for Duitku webhook verification
 * Some payment gateways send GET requests to verify the endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Duitku webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
