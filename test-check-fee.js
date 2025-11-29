const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkTransactions() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  const collection = db.collection('transactions');
  
  // Get recent transactions
  const transactions = await collection.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('\n=== RECENT TRANSACTIONS ===\n');
  transactions.forEach((t, i) => {
    console.log(`${i+1}. Invoice: ${t.invoiceId}`);
    console.log(`   Service: ${t.serviceName}`);
    console.log(`   Total Amount: ${t.totalAmount}`);
    console.log(`   Final Amount: ${t.finalAmount}`);
    console.log(`   Payment Fee: ${t.paymentFee || 'NOT SET'}`);
    console.log(`   Payment Gateway: ${t.paymentGateway || 'NOT SET'}`);
    console.log(`   Created: ${t.createdAt}`);
    console.log('');
  });
  
  await mongoose.disconnect();
}

checkTransactions().catch(console.error);
