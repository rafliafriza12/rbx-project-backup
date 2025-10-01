// Debug script to check transactions in database
const mongoose = require("mongoose");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rbx-store";

mongoose.connect(MONGODB_URI);

const transactionSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "transactions" }
);
const Transaction = mongoose.model("Transaction", transactionSchema);

async function debugTransactions() {
  try {
    console.log("=== DATABASE DEBUG ===");

    // Count all transactions
    const totalCount = await Transaction.countDocuments();
    console.log("Total transactions in database:", totalCount);

    // Get sample transactions
    const sampleTransactions = await Transaction.find().limit(3);
    console.log("\nSample transactions:");
    sampleTransactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log("- Invoice ID:", tx.invoiceId);
      console.log("- Service Type:", tx.serviceType);
      console.log("- Service Name:", tx.serviceName);
      console.log("- Payment Status:", tx.paymentStatus);
      console.log("- Order Status:", tx.orderStatus);
      console.log("- Customer Info:", {
        userId: tx.customerInfo?.userId,
        name: tx.customerInfo?.name,
        email: tx.customerInfo?.email,
      });
      console.log("- Created At:", tx.createdAt);
    });

    // Check for different customerInfo.userId values
    const userIds = await Transaction.distinct("customerInfo.userId");
    console.log("\nDistinct customerInfo.userId values:");
    console.log(userIds);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    mongoose.disconnect();
  }
}

debugTransactions();
