// Debug script to check payment fee in database
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Read .env file manually
let MONGODB_URI = "";
try {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    const match = envFile.match(/MONGODB_URI=(.+)/);
    if (match) {
      MONGODB_URI = match[1].trim();
    }
  }
} catch (err) {
  console.error("Error reading .env.local:", err.message);
}

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not found in .env.local file!");
  console.log("Please make sure .env.local file exists with MONGODB_URI");
  process.exit(1);
}

const transactionSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true }
);
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

async function checkPaymentFees() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!\n");

    // Get all transactions
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Found ${transactions.length} transactions\n`);
    console.log("=".repeat(80));

    for (const tx of transactions) {
      console.log(`\nInvoice: ${tx.invoiceId}`);
      console.log(`Midtrans Order ID: ${tx.midtransOrderId || "N/A"}`);
      console.log(`Service: ${tx.serviceName}`);
      console.log(
        `Total Amount: Rp${tx.totalAmount?.toLocaleString("id-ID") || 0}`
      );
      console.log(
        `Discount Amount: Rp${tx.discountAmount?.toLocaleString("id-ID") || 0}`
      );
      console.log(
        `Final Amount: Rp${tx.finalAmount?.toLocaleString("id-ID") || 0}`
      );
      console.log(
        `Payment Fee: Rp${tx.paymentFee?.toLocaleString("id-ID") || 0}`
      );
      console.log(
        `Payment Fee exists: ${
          tx.paymentFee !== undefined && tx.paymentFee !== null
        }`
      );
      console.log(`Payment Fee type: ${typeof tx.paymentFee}`);
      console.log(`Payment Status: ${tx.paymentStatus}`);
      console.log(`Created At: ${tx.createdAt}`);
      console.log("-".repeat(80));
    }

    // Check for multi-checkout transactions
    console.log("\n\n=== MULTI-CHECKOUT ANALYSIS ===\n");
    const multiCheckoutOrders = await Transaction.aggregate([
      {
        $match: {
          midtransOrderId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$midtransOrderId",
          count: { $sum: 1 },
          transactions: {
            $push: {
              invoiceId: "$invoiceId",
              finalAmount: "$finalAmount",
              paymentFee: "$paymentFee",
              serviceName: "$serviceName",
            },
          },
          totalPaymentFee: { $sum: "$paymentFee" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    if (multiCheckoutOrders.length > 0) {
      console.log(
        `Found ${multiCheckoutOrders.length} multi-checkout orders:\n`
      );

      for (const order of multiCheckoutOrders) {
        console.log(`Order ID: ${order._id}`);
        console.log(`Number of items: ${order.count}`);
        console.log(
          `Total Payment Fee in all items: Rp${
            order.totalPaymentFee?.toLocaleString("id-ID") || 0
          }`
        );
        console.log("Items:");
        order.transactions.forEach((tx, idx) => {
          console.log(`  ${idx + 1}. ${tx.invoiceId} - ${tx.serviceName}`);
          console.log(
            `     Final Amount: Rp${
              tx.finalAmount?.toLocaleString("id-ID") || 0
            }`
          );
          console.log(
            `     Payment Fee: Rp${tx.paymentFee?.toLocaleString("id-ID") || 0}`
          );
        });
        console.log("-".repeat(80));
      }
    } else {
      console.log("No multi-checkout transactions found.");
    }

    // Summary statistics
    console.log("\n\n=== SUMMARY STATISTICS ===\n");
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          withPaymentFee: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$paymentFee", null] },
                    { $gt: ["$paymentFee", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalPaymentFees: { $sum: "$paymentFee" },
          avgPaymentFee: { $avg: "$paymentFee" },
        },
      },
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`Total Transactions: ${stat.totalTransactions}`);
      console.log(`Transactions with Payment Fee: ${stat.withPaymentFee}`);
      console.log(
        `Total Payment Fees: Rp${
          stat.totalPaymentFees?.toLocaleString("id-ID") || 0
        }`
      );
      console.log(
        `Average Payment Fee: Rp${
          stat.avgPaymentFee?.toLocaleString("id-ID") || 0
        }`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed.");
  }
}

checkPaymentFees();
