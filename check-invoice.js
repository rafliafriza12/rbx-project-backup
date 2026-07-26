const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
      if (match) {
        let value = (match[2] || "").trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[match[1]] = value;
      }
    });
  }
} catch (e) {}

const INVOICE_ID = process.argv[2] || "INV-1785041200675-IW0DEA";

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const TxSchema = new mongoose.Schema({}, { strict: false, collection: "transactions" });
    const Tx = mongoose.models.Transaction || mongoose.model("Transaction", TxSchema);

    const tx = await Tx.findOne({ invoiceId: INVOICE_ID }).lean();
    if (!tx) {
        console.log(`❌ Transaction NOT FOUND: ${INVOICE_ID}`);
        mongoose.connection.close();
        return;
    }

    console.log("=".repeat(60));
    console.log(`Invoice ID    : ${tx.invoiceId}`);
    console.log(`Service Type  : ${tx.serviceType} / ${tx.serviceCategory || "-"}`);
    console.log(`Payment GW    : ${tx.paymentGateway}`);
    console.log(`Payment Status: ${tx.paymentStatus}`);
    console.log(`Order Status  : ${tx.orderStatus}`);
    console.log(`Amount        : Rp ${tx.totalAmount?.toLocaleString("id-ID")}`);
    console.log(`midtransOrderId: ${tx.midtransOrderId || "❌ MISSING"}`);
    console.log(`midtransTransactionId: ${tx.midtransTransactionId || "NONE"}`);
    console.log(`Created At    : ${new Date(tx.createdAt).toLocaleString("id-ID")}`);
    console.log(`Updated At    : ${new Date(tx.updatedAt).toLocaleString("id-ID")}`);
    console.log("-".repeat(60));
    console.log(`Status History (${tx.statusHistory?.length || 0} entries):`);
    if (tx.statusHistory?.length > 0) {
        tx.statusHistory.forEach((h, i) => {
            console.log(`  [${i+1}] ${h.status.padEnd(30)} | ${new Date(h.timestamp).toLocaleString("id-ID")} | ${h.notes || ""} | by: ${h.updatedBy || "-"}`);
        });
    } else {
        console.log("  (no history)");
    }
    console.log("=".repeat(60));

    mongoose.connection.close();
});
