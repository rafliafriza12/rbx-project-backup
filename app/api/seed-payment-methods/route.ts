import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PaymentMethod from "@/models/PaymentMethod";

// Sample payment methods data
const samplePaymentMethods = [
  // E-Wallet
  {
    code: "GOPAY",
    name: "GoPay",
    category: "ewallet",
    icon: "💚",
    fee: 2500,
    feeType: "fixed",
    description: "Transfer langsung ke GoPay dengan instant notification",
    isActive: true,
    displayOrder: 0,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 2000000,
    instructions:
      "1. Pilih GoPay sebagai metode pembayaran\n2. Buka aplikasi Gojek di HP Anda\n3. Scan QR Code yang muncul\n4. Confirm pembayaran di aplikasi Gojek\n5. Pembayaran akan otomatis terverifikasi",
  },
  {
    code: "SHOPEEPAY",
    name: "ShopeePay",
    category: "ewallet",
    icon: "🛒",
    fee: 2500,
    feeType: "fixed",
    description: "Transfer langsung ke ShopeePay",
    isActive: true,
    displayOrder: 10,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 2000000,
    instructions:
      "1. Pilih ShopeePay sebagai metode pembayaran\n2. Buka aplikasi Shopee di HP Anda\n3. Pilih menu ShopeePay\n4. Scan QR Code atau masukkan nomor VA\n5. Confirm pembayaran",
  },

  // QRIS
  {
    code: "QRIS",
    name: "QRIS",
    category: "qris",
    icon: "📱",
    fee: 0.7,
    feeType: "percentage",
    description:
      "Scan QR Code untuk pembayaran instant dari semua e-wallet dan mobile banking",
    isActive: true,
    displayOrder: 0,
    midtransEnabled: true,
    minimumAmount: 1500,
    maximumAmount: 10000000,
    instructions:
      "1. Pilih QRIS sebagai metode pembayaran\n2. QR Code akan muncul\n3. Buka aplikasi e-wallet atau mobile banking Anda (GoPay, OVO, Dana, LinkAja, dll)\n4. Scan QR Code\n5. Confirm pembayaran di aplikasi",
  },

  // Bank Transfer - Virtual Account
  {
    code: "BCA_VA",
    name: "BCA Virtual Account",
    category: "bank_transfer",
    icon: "🏦",
    fee: 4000,
    feeType: "fixed",
    description:
      "Transfer melalui ATM, Mobile Banking, atau Internet Banking BCA",
    isActive: true,
    displayOrder: 0,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 50000000,
    instructions:
      "1. Pilih BCA Virtual Account\n2. Nomor VA BCA akan muncul\n3. Transfer ke nomor VA melalui:\n   - ATM BCA\n   - BCA Mobile\n   - KlikBCA (Internet Banking)\n4. Masukkan nominal yang tepat\n5. Pembayaran akan otomatis terverifikasi dalam 5 menit",
  },
  {
    code: "BNI_VA",
    name: "BNI Virtual Account",
    category: "bank_transfer",
    icon: "🏦",
    fee: 4000,
    feeType: "fixed",
    description:
      "Transfer melalui ATM, Mobile Banking, atau Internet Banking BNI",
    isActive: true,
    displayOrder: 10,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 50000000,
    instructions:
      "1. Pilih BNI Virtual Account\n2. Nomor VA BNI akan muncul\n3. Transfer ke nomor VA melalui:\n   - ATM BNI\n   - BNI Mobile Banking\n   - BNI Internet Banking\n4. Masukkan nominal yang tepat\n5. Pembayaran akan otomatis terverifikasi",
  },
  {
    code: "BRI_VA",
    name: "BRI Virtual Account",
    category: "bank_transfer",
    icon: "🏦",
    fee: 4000,
    feeType: "fixed",
    description:
      "Transfer melalui ATM, Mobile Banking, atau Internet Banking BRI",
    isActive: true,
    displayOrder: 20,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 50000000,
    instructions:
      "1. Pilih BRI Virtual Account\n2. Nomor VA BRI akan muncul\n3. Transfer ke nomor VA melalui:\n   - ATM BRI\n   - BRI Mobile\n   - BRI Internet Banking\n4. Masukkan nominal yang tepat\n5. Pembayaran akan otomatis terverifikasi",
  },
  {
    code: "PERMATA_VA",
    name: "Permata Virtual Account",
    category: "bank_transfer",
    icon: "🏦",
    fee: 4000,
    feeType: "fixed",
    description:
      "Transfer melalui ATM, Mobile Banking, atau Internet Banking Permata",
    isActive: true,
    displayOrder: 30,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 50000000,
    instructions:
      "1. Pilih Permata Virtual Account\n2. Nomor VA Permata akan muncul\n3. Transfer ke nomor VA melalui:\n   - ATM Permata\n   - PermataMobile X\n   - PermataNet\n4. Masukkan nominal yang tepat\n5. Pembayaran akan otomatis terverifikasi",
  },
  {
    code: "ECHANNEL",
    name: "Mandiri Bill Payment",
    category: "bank_transfer",
    icon: "🏦",
    fee: 4000,
    feeType: "fixed",
    description: "Transfer melalui ATM Mandiri atau Livin by Mandiri",
    isActive: true,
    displayOrder: 40,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 50000000,
    instructions:
      "1. Pilih Mandiri Bill Payment\n2. Kode perusahaan dan kode bayar akan muncul\n3. Di ATM Mandiri: Pilih Bayar/Beli > Multipayment\n4. Masukkan kode perusahaan: 70012 (Midtrans)\n5. Masukkan kode bayar\n6. Confirm pembayaran",
  },

  // Retail / Minimarket
  {
    code: "INDOMARET",
    name: "Indomaret",
    category: "retail",
    icon: "🏪",
    fee: 2500,
    feeType: "fixed",
    description: "Bayar di kasir Indomaret terdekat",
    isActive: true,
    displayOrder: 0,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 5000000,
    instructions:
      "1. Pilih Indomaret sebagai metode pembayaran\n2. Kode pembayaran akan muncul\n3. Kunjungi Indomaret terdekat\n4. Tunjukkan kode pembayaran ke kasir\n5. Bayar dengan tunai\n6. Simpan struk sebagai bukti pembayaran",
  },
  {
    code: "ALFAMART",
    name: "Alfamart",
    category: "retail",
    icon: "🏪",
    fee: 2500,
    feeType: "fixed",
    description: "Bayar di kasir Alfamart terdekat",
    isActive: true,
    displayOrder: 10,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 5000000,
    instructions:
      "1. Pilih Alfamart sebagai metode pembayaran\n2. Kode pembayaran akan muncul\n3. Kunjungi Alfamart terdekat\n4. Tunjukkan kode pembayaran ke kasir\n5. Bayar dengan tunai\n6. Simpan struk sebagai bukti pembayaran",
  },

  // Credit Card
  {
    code: "CREDIT_CARD",
    name: "Credit Card",
    category: "credit_card",
    icon: "💳",
    fee: 2.9,
    feeType: "percentage",
    description: "Pembayaran dengan kartu kredit Visa, MasterCard, JCB",
    isActive: true,
    displayOrder: 0,
    midtransEnabled: true,
    minimumAmount: 10000,
    maximumAmount: 100000000,
    instructions:
      "1. Pilih Credit Card sebagai metode pembayaran\n2. Masukkan detail kartu kredit Anda:\n   - Nomor kartu\n   - Nama di kartu\n   - Tanggal expired\n   - CVV (3 digit di belakang kartu)\n3. Klik Bayar\n4. Masukkan OTP jika diminta\n5. Pembayaran akan diproses",
  },
];

export async function POST() {
  try {
    await connectDB();

    // Clear existing payment methods
    const deleteResult = await PaymentMethod.deleteMany({});
    console.log(
      `Deleted ${deleteResult.deletedCount} existing payment methods`
    );

    // Insert sample payment methods
    const results = [];
    const errors = [];

    for (const pm of samplePaymentMethods) {
      try {
        const created = await PaymentMethod.create(pm);
        results.push({
          code: created.code,
          name: created.name,
          category: created.category,
          status: "created",
        });
      } catch (error: any) {
        errors.push({
          code: pm.code,
          error: error.message,
        });
      }
    }

    // Get statistics
    const total = await PaymentMethod.countDocuments();
    const active = await PaymentMethod.countDocuments({ isActive: true });
    const midtransEnabled = await PaymentMethod.countDocuments({
      midtransEnabled: true,
    });

    // Get by category
    const categories = await PaymentMethod.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      message: "Payment methods seeded successfully",
      data: {
        created: results,
        errors: errors,
        statistics: {
          total,
          active,
          midtransEnabled,
          byCategory: categories.reduce((acc: any, cat: any) => {
            acc[cat._id] = cat.count;
            return acc;
          }, {}),
        },
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed payment methods",
      },
      { status: 500 }
    );
  }
}
