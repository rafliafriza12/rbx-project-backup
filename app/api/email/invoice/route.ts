import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import EmailService from "@/lib/email";

// POST - Kirim ulang email invoice
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { transactionId, invoiceId, email } = body;

    // Validate input
    if (!transactionId && !invoiceId) {
      return NextResponse.json(
        { error: "Transaction ID atau Invoice ID diperlukan" },
        { status: 400 }
      );
    }

    // Find transaction
    let transaction;
    if (transactionId) {
      transaction = await Transaction.findById(transactionId);
    } else if (invoiceId) {
      transaction = await Transaction.findOne({ invoiceId });
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Use provided email or transaction's customer email
    const emailAddress = email || transaction.customerInfo.email;

    if (!emailAddress) {
      return NextResponse.json(
        { error: "Email address tidak tersedia" },
        { status: 400 }
      );
    }

    // Update email if different
    if (email && email !== transaction.customerInfo.email) {
      transaction.customerInfo.email = email;
      await transaction.save();
    }

    // Send invoice email
    const emailSent = await EmailService.sendInvoiceEmail(transaction);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: "Email invoice berhasil dikirim",
        sentTo: emailAddress,
      });
    } else {
      return NextResponse.json(
        { error: "Gagal mengirim email invoice" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending invoice email:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// GET - Test email configuration
export async function GET() {
  try {
    await dbConnect();

    // Test email by sending a test message
    const testEmailSent = await EmailService.sendEmail({
      to: "test@example.com", // This will fail but we can check the config
      subject: "Test Email Configuration",
      html: "<h1>Test</h1><p>This is a test email to check configuration.</p>",
    });

    return NextResponse.json({
      success: true,
      message: "Email configuration test completed",
      result: testEmailSent,
    });
  } catch (error) {
    console.error("Error testing email configuration:", error);
    return NextResponse.json(
      { error: "Error testing email configuration" },
      { status: 500 }
    );
  }
}
