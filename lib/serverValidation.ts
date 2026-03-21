/**
 * Server-side validation untuk transaksi.
 * JANGAN percaya data dari frontend mentah-mentah.
 * Semua harga, diskon, dan fee dihitung ulang dari database.
 */

import dbConnect from "@/lib/mongodb";

// ============================================================
// 0a. Verifikasi Roblox username via Roblox API (anti-spoof)
// ============================================================
export async function verifyRobloxUsername(username: string): Promise<{
  valid: boolean;
  error?: string;
  verifiedUsername?: string;
  userId?: number;
  displayName?: string;
}> {
  if (!username || typeof username !== "string" || username.trim() === "") {
    return { valid: false, error: "Roblox username diperlukan" };
  }

  const trimmed = username.trim();

  // Basic format validation: Roblox usernames are 3-20 chars, alphanumeric + underscore
  if (trimmed.length < 3 || trimmed.length > 20) {
    return {
      valid: false,
      error: "Roblox username harus 3-20 karakter",
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Roblox username hanya boleh huruf, angka, dan underscore",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [trimmed],
          excludeBannedUsers: false,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Roblox username API error: HTTP ${response.status}`);
      return {
        valid: false,
        error: `Gagal memverifikasi username dari Roblox (HTTP ${response.status})`,
      };
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      console.warn(`⚠️ Roblox username "${trimmed}" not found via Roblox API`);
      return {
        valid: false,
        error: `Username Roblox "${trimmed}" tidak ditemukan`,
      };
    }

    const user = data.data[0];
    console.log(
      `✅ Roblox username verified: "${trimmed}" → id=${user.id}, name="${user.name}", displayName="${user.displayName}"`,
    );

    return {
      valid: true,
      verifiedUsername: user.name, // Use the exact casing from Roblox
      userId: user.id,
      displayName: user.displayName,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        valid: false,
        error: "Roblox API timeout saat verifikasi username",
      };
    }
    console.error("Error verifying Roblox username:", error);
    return {
      valid: false,
      error: "Gagal memverifikasi username dari Roblox",
    };
  }
}

// ============================================================
// 0b. Verifikasi gamepass via Roblox API (anti-spoof)
// ============================================================
export async function verifyGamepassFromRoblox(
  placeId: number | string,
  expectedPrice: number,
): Promise<{
  valid: boolean;
  error?: string;
  gamepass?: {
    id: number;
    name: string;
    price: number;
    sellerId: number;
    productId: number;
  };
}> {
  if (!placeId || !expectedPrice) {
    return { valid: false, error: "placeId dan expectedPrice diperlukan" };
  }

  try {
    const apiEndpoint = `https://apis.roblox.com/game-passes/v1/universes/${placeId}/game-passes?passView=Full&pageSize=100`;
    console.log(
      `🔍 [Server] Verifying gamepass at placeId=${placeId}, expectedPrice=${expectedPrice}`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiEndpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        valid: false,
        error: `Roblox API error: HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.errors || data.code === 0) {
      return {
        valid: false,
        error: data.message || "Roblox API returned error",
      };
    }

    const gamePasses = data.gamePasses || [];
    // Find gamepass matching expected price exactly
    const matching = gamePasses.find((gp: any) => gp.price === expectedPrice);

    if (!matching) {
      console.warn(
        `⚠️ No gamepass found with price=${expectedPrice} at placeId=${placeId}. ` +
          `Available: ${gamePasses.map((gp: any) => `${gp.name}(${gp.price})`).join(", ")}`,
      );
      return {
        valid: false,
        error: `GamePass dengan harga ${expectedPrice} Robux tidak ditemukan di place ${placeId}`,
      };
    }

    console.log(
      `✅ [Server] Gamepass verified from Roblox API: id=${matching.id}, name=${matching.name}, price=${matching.price}`,
    );

    return {
      valid: true,
      gamepass: {
        id: matching.id,
        name: matching.name || matching.displayName,
        price: matching.price,
        sellerId: matching.creator?.creatorId,
        productId: matching.productId,
      },
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { valid: false, error: "Roblox API timeout" };
    }
    console.error("Error verifying gamepass from Roblox:", error);
    return { valid: false, error: "Gagal memverifikasi gamepass dari Roblox" };
  }
}

// ============================================================
// 0c. Validasi & enforce quantity dari server side
// ============================================================
const MAX_QUANTITY = 100; // Batas maksimum quantity per transaksi

export function getVerifiedQuantity(
  serviceType: string,
  serviceCategory?: string,
  clientQuantity?: any,
): { valid: boolean; quantity: number; error?: string } {
  // Service types yang quantity-nya SELALU 1 (tidak bisa diubah user)
  const forceQuantityOne =
    serviceType === "joki" ||
    serviceType === "reseller" ||
    (serviceType === "robux" && serviceCategory === "robux_5_hari") ||
    (serviceType === "robux" && serviceCategory === "robux_instant");

  if (forceQuantityOne) {
    if (clientQuantity && parseInt(clientQuantity, 10) !== 1) {
      console.warn(
        `⚠️ QUANTITY OVERRIDE: ${serviceType}/${serviceCategory} forced to 1 (client sent: ${clientQuantity})`,
      );
    }
    return { valid: true, quantity: 1 };
  }

  // Untuk tipe lain (gamepass): quantity dari client, tapi divalidasi ketat
  const parsed = parseInt(clientQuantity, 10);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return {
      valid: false,
      quantity: 0,
      error: "Quantity harus berupa angka yang valid",
    };
  }

  if (parsed < 1) {
    return {
      valid: false,
      quantity: 0,
      error: "Quantity minimal 1",
    };
  }

  if (parsed > MAX_QUANTITY) {
    return {
      valid: false,
      quantity: 0,
      error: `Quantity maksimal ${MAX_QUANTITY}`,
    };
  }

  // Pastikan integer bulat (bukan float)
  if (
    parsed !== Number(clientQuantity) &&
    !Number.isInteger(Number(clientQuantity))
  ) {
    console.warn(
      `⚠️ QUANTITY SANITIZED: float ${clientQuantity} → integer ${parsed}`,
    );
  }

  return { valid: true, quantity: parsed };
}

// ============================================================
// 1. Validasi & ambil harga asli item dari database
// ============================================================
export async function getVerifiedUnitPrice(
  serviceType: string,
  serviceId: string,
  serviceCategory?: string,
  rbx5Details?: any,
  quantity?: number,
  gamepassDetails?: any,
  serviceName?: string,
): Promise<{
  valid: boolean;
  unitPrice: number;
  error?: string;
  robuxAmount?: number;
  gamepassAmount?: number;
  pricePerHundred?: number;
  verifiedResellerDetails?: {
    tier: number;
    duration: number;
    discount: number;
    features: string[];
  };
  verifiedServiceName?: string;
  verifiedRobuxInstantDetails?: {
    robuxAmount: number;
    productName: string;
    description: string;
  };
  verifiedGamepassDetails?: {
    gameName: string;
    itemName: string;
    gamepassId: string;
    serviceImage: string;
    serviceName: string;
  };
}> {
  await dbConnect();

  try {
    // ---- GAMEPASS ----
    if (serviceType === "gamepass") {
      const Gamepass = (await import("@/models/Gamepass")).default;

      // Tentukan itemName dari gamepassDetails atau serviceName
      // serviceName format: "GameName - ItemName"
      const itemName =
        gamepassDetails?.itemName ||
        (serviceName && serviceName.includes(" - ")
          ? serviceName.split(" - ").slice(1).join(" - ")
          : null);

      // 1. Coba cari berdasarkan item._id = serviceId (jika serviceId = item subdocument ID)
      const gamepassByItemId = await Gamepass.findOne({
        "item._id": serviceId,
      });
      if (gamepassByItemId) {
        const item = gamepassByItemId.item.find(
          (i: any) => i._id.toString() === serviceId,
        );
        if (item) {
          console.log(
            `✅ Gamepass price verified by item._id: ${item.itemName} = ${item.price}`,
          );
          return {
            valid: true,
            unitPrice: item.price,
            verifiedGamepassDetails: {
              gameName: gamepassByItemId.gameName,
              itemName: item.itemName,
              gamepassId: gamepassByItemId._id.toString(),
              serviceImage: item.imgUrl || gamepassByItemId.imgUrl || "",
              serviceName: `${gamepassByItemId.gameName} - ${item.itemName}`,
            },
          };
        }
      }

      // 2. Cari berdasarkan gamepass._id = serviceId (frontend mengirim gamepass ID)
      const gamepassById = await Gamepass.findById(serviceId);
      if (gamepassById && gamepassById.item.length > 0) {
        // Jika ada itemName, cari item yang cocok
        if (itemName) {
          const matchedItem = gamepassById.item.find(
            (i: any) =>
              i.itemName === itemName ||
              i.itemName.toLowerCase() === itemName.toLowerCase(),
          );
          if (matchedItem) {
            console.log(
              `✅ Gamepass price verified by itemName "${itemName}": ${matchedItem.price}`,
            );
            return {
              valid: true,
              unitPrice: matchedItem.price,
              verifiedGamepassDetails: {
                gameName: gamepassById.gameName,
                itemName: matchedItem.itemName,
                gamepassId: gamepassById._id.toString(),
                serviceImage: matchedItem.imgUrl || gamepassById.imgUrl || "",
                serviceName: `${gamepassById.gameName} - ${matchedItem.itemName}`,
              },
            };
          }
          console.warn(
            `⚠️ Item "${itemName}" not found in gamepass "${gamepassById.gameName}". Available items: ${gamepassById.item.map((i: any) => i.itemName).join(", ")}`,
          );
        }

        // Jika hanya 1 item, aman menggunakan item pertama
        if (gamepassById.item.length === 1) {
          console.log(
            `✅ Gamepass has single item, using: ${gamepassById.item[0].itemName} = ${gamepassById.item[0].price}`,
          );
          return {
            valid: true,
            unitPrice: gamepassById.item[0].price,
            verifiedGamepassDetails: {
              gameName: gamepassById.gameName,
              itemName: gamepassById.item[0].itemName,
              gamepassId: gamepassById._id.toString(),
              serviceImage:
                gamepassById.item[0].imgUrl || gamepassById.imgUrl || "",
              serviceName: `${gamepassById.gameName} - ${gamepassById.item[0].itemName}`,
            },
          };
        }

        // Multi-item gamepass tanpa itemName — tidak bisa verifikasi
        console.error(
          `❌ Cannot verify gamepass price: multiple items but no itemName provided. Gamepass: ${gamepassById.gameName}, Items: ${gamepassById.item.map((i: any) => `${i.itemName}(${i.price})`).join(", ")}`,
        );
        return {
          valid: false,
          unitPrice: 0,
          error: `Tidak dapat memverifikasi harga gamepass: item tidak teridentifikasi`,
        };
      }

      return {
        valid: false,
        unitPrice: 0,
        error: `Gamepass tidak ditemukan: ${serviceId}`,
      };
    }

    // ---- ROBUX 5 HARI ----
    if (
      serviceType === "robux" &&
      (serviceCategory === "robux_5_hari" || rbx5Details)
    ) {
      const RobuxPricing = (await import("@/models/RobuxPricing")).default;
      const Product = (await import("@/models/Product")).default;
      const mongoose = (await import("mongoose")).default;

      // Get pricePerHundred ALWAYS from DB - never trust client
      const pricing = await RobuxPricing.findOne().sort({ updatedAt: -1 });

      if (!pricing) {
        return {
          valid: false,
          unitPrice: 0,
          error: "Harga Robux 5 Hari belum dikonfigurasi",
        };
      }

      let robuxAmount = 0;

      // Case 1: serviceId is a valid ObjectId → fixed package from DB
      if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
        const product = await Product.findById(serviceId);
        if (product && product.category === "robux_5_hari") {
          robuxAmount = product.robuxAmount;
          console.log(
            `✅ Rbx5 fixed package: robuxAmount=${robuxAmount} from Product DB (client sent: ${rbx5Details?.robuxAmount ?? "N/A"})`,
          );
        } else if (product) {
          return {
            valid: false,
            unitPrice: 0,
            error: `Product ${serviceId} bukan kategori robux_5_hari`,
          };
        } else {
          return {
            valid: false,
            unitPrice: 0,
            error: `Product robux_5_hari tidak ditemukan: ${serviceId}`,
          };
        }
      } else {
        // Case 2: Custom order (serviceId like "custom_25")
        // robuxAmount comes from client, but must be a positive integer
        robuxAmount = parseInt(rbx5Details?.robuxAmount || quantity || 0, 10);
        if (isNaN(robuxAmount) || robuxAmount <= 24) {
          return {
            valid: false,
            unitPrice: 0,
            error: "Jumlah Robux untuk custom order harus lebih dari 0",
          };
        }
        console.log(
          `✅ Rbx5 custom order: robuxAmount=${robuxAmount} (from client, pricePerHundred from DB: ${pricing.pricePerHundred})`,
        );
      }

      // Price ALWAYS calculated server-side from DB's pricePerHundred
      const calculatedPrice = Math.ceil(
        (robuxAmount / 100) * pricing.pricePerHundred,
      );

      // gamepassAmount ALWAYS calculated server-side (Roblox 30% tax)
      const gamepassFeeMultiplier = parseFloat(
        process.env.NEXT_PUBLIC_GAMEPASS_FEE_MULTIPLIER || "1.43",
      );
      const gamepassAmount = Math.ceil(robuxAmount * gamepassFeeMultiplier);

      return {
        valid: true,
        unitPrice: calculatedPrice,
        robuxAmount,
        gamepassAmount,
        pricePerHundred: pricing.pricePerHundred,
      };
    }

    // ---- ROBUX INSTANT ----
    if (
      serviceType === "robux" &&
      (serviceCategory === "robux_instant" || !serviceCategory)
    ) {
      const Product = (await import("@/models/Product")).default;
      const product = await Product.findById(serviceId);

      if (product && product.category === "robux_instant") {
        console.log(
          `✅ Robux Instant price verified from Product: ${product.name} = ${product.price}, robuxAmount=${product.robuxAmount}`,
        );
        return {
          valid: true,
          unitPrice: product.price,
          verifiedRobuxInstantDetails: {
            robuxAmount: product.robuxAmount,
            productName: product.name,
            description: product.description,
          },
        };
      }

      return {
        valid: false,
        unitPrice: 0,
        error: `Product robux_instant tidak ditemukan: ${serviceId}`,
      };
    }

    // ---- RESELLER PACKAGE ----
    if (serviceType === "reseller") {
      const ResellerPackage = (await import("@/models/ResellerPackage"))
        .default;
      const pkg = await ResellerPackage.findById(serviceId);

      if (!pkg) {
        return {
          valid: false,
          unitPrice: 0,
          error: `Paket reseller tidak ditemukan: ${serviceId}`,
        };
      }

      return {
        valid: true,
        unitPrice: pkg.price,
        verifiedResellerDetails: {
          tier: pkg.tier,
          duration: pkg.duration,
          discount: pkg.discount,
          features: pkg.features || [],
        },
        verifiedServiceName: pkg.name,
      };
    }

    // ---- JOKI ----
    if (serviceType === "joki") {
      // Joki menggunakan gamepass item price juga
      const Gamepass = (await import("@/models/Gamepass")).default;
      const gamepass = await Gamepass.findOne({ "item._id": serviceId });
      if (gamepass) {
        const item = gamepass.item.find(
          (i: any) => i._id.toString() === serviceId,
        );
        if (item) {
          return { valid: true, unitPrice: item.price };
        }
      }

      return {
        valid: false,
        unitPrice: 0,
        error: `Joki item tidak ditemukan: ${serviceId}`,
      };
    }

    // Tipe tidak dikenal - tolak
    return {
      valid: false,
      unitPrice: 0,
      error: `Tipe layanan tidak dikenal: ${serviceType}`,
    };
  } catch (error) {
    console.error("Error verifying unit price:", error);
    return {
      valid: false,
      unitPrice: 0,
      error: "Gagal memverifikasi harga dari database",
    };
  }
}

// ============================================================
// 2. Validasi & ambil diskon asli user dari database
// ============================================================
export async function getVerifiedDiscount(
  userId: string | null,
): Promise<{ discountPercentage: number }> {
  if (!userId) {
    return { discountPercentage: 0 };
  }

  try {
    await dbConnect();
    const User = (await import("@/models/User")).default;
    const ResellerPackage = (await import("@/models/ResellerPackage")).default;

    const user = await User.findById(userId);
    if (!user) {
      return { discountPercentage: 0 };
    }

    // Cek apakah user punya reseller package yang aktif
    if (
      user.resellerPackageId &&
      user.resellerExpiry &&
      new Date(user.resellerExpiry) > new Date()
    ) {
      const resellerPackage = await ResellerPackage.findById(
        user.resellerPackageId,
      );
      if (resellerPackage) {
        return { discountPercentage: resellerPackage.discount };
      }
    }

    return { discountPercentage: 0 };
  } catch (error) {
    console.error("Error verifying discount:", error);
    return { discountPercentage: 0 };
  }
}

// ============================================================
// 3. Validasi & hitung payment fee dari database
// ============================================================
export async function getVerifiedPaymentFee(
  paymentMethodId: string | null,
  baseAmount: number,
): Promise<{
  fee: number;
  paymentMethodName: string | null;
  validPaymentMethodId: string | null;
  paymentMethodDoc: any;
}> {
  if (!paymentMethodId) {
    return {
      fee: 0,
      paymentMethodName: null,
      validPaymentMethodId: null,
      paymentMethodDoc: null,
    };
  }

  try {
    await dbConnect();
    const PaymentMethod = (await import("@/models/PaymentMethod")).default;
    const mongoose = await import("mongoose");

    let paymentMethodDoc = null;

    // Cek apakah paymentMethodId adalah ObjectId atau code
    if (mongoose.default.Types.ObjectId.isValid(paymentMethodId)) {
      paymentMethodDoc = await PaymentMethod.findById(paymentMethodId);
    } else {
      // Cari berdasarkan code (case-insensitive)
      paymentMethodDoc = await PaymentMethod.findOne({
        $or: [
          { code: paymentMethodId.toUpperCase() },
          { code: paymentMethodId.toLowerCase() },
          { code: paymentMethodId },
        ],
      });
    }

    if (!paymentMethodDoc) {
      console.warn(`Payment method tidak ditemukan: ${paymentMethodId}`);
      return {
        fee: 0,
        paymentMethodName: null,
        validPaymentMethodId: null,
        paymentMethodDoc: null,
      };
    }

    // Validasi apakah payment method aktif
    if (!paymentMethodDoc.isActive) {
      console.warn(`Payment method tidak aktif: ${paymentMethodDoc.name}`);
      return {
        fee: 0,
        paymentMethodName: paymentMethodDoc.name,
        validPaymentMethodId: paymentMethodDoc._id.toString(),
        paymentMethodDoc: null,
      };
    }

    // Validasi min/max amount
    if (
      paymentMethodDoc.minimumAmount &&
      paymentMethodDoc.minimumAmount > 0 &&
      baseAmount < paymentMethodDoc.minimumAmount
    ) {
      console.warn(
        `Amount ${baseAmount} di bawah minimum ${paymentMethodDoc.minimumAmount} untuk ${paymentMethodDoc.name}`,
      );
    }

    if (
      paymentMethodDoc.maximumAmount &&
      paymentMethodDoc.maximumAmount > 0 &&
      baseAmount > paymentMethodDoc.maximumAmount
    ) {
      console.warn(
        `Amount ${baseAmount} di atas maximum ${paymentMethodDoc.maximumAmount} untuk ${paymentMethodDoc.name}`,
      );
    }

    // Hitung fee dari database
    let calculatedFee = 0;
    if (paymentMethodDoc.feeType === "percentage") {
      calculatedFee = Math.round((baseAmount * paymentMethodDoc.fee) / 100);
    } else {
      calculatedFee = paymentMethodDoc.fee || 0;
    }

    return {
      fee: calculatedFee,
      paymentMethodName: paymentMethodDoc.name,
      validPaymentMethodId: paymentMethodDoc._id.toString(),
      paymentMethodDoc,
    };
  } catch (error) {
    console.error("Error verifying payment fee:", error);
    return {
      fee: 0,
      paymentMethodName: null,
      validPaymentMethodId: null,
      paymentMethodDoc: null,
    };
  }
}

// ============================================================
// 4. Validasi lengkap transaksi single item
// ============================================================
export async function validateSingleTransaction(body: any): Promise<{
  valid: boolean;
  error?: string;
  verified: {
    quantity: number; // Server-verified quantity
    unitPrice: number;
    totalAmount: number;
    discountPercentage: number;
    discountAmount: number;
    finalAmountBeforeFee: number;
    paymentFee: number;
    finalAmountWithFee: number;
    paymentMethodName: string | null;
    validPaymentMethodId: string | null;
    paymentMethodDoc: any;
    // Rbx5 verified values from DB
    verifiedRobuxAmount?: number;
    verifiedGamepassAmount?: number;
    verifiedPricePerHundred?: number;
    // Reseller verified values from DB
    verifiedResellerDetails?: {
      tier: number;
      duration: number;
      discount: number;
      features: string[];
    };
    verifiedServiceName?: string;
    // Robux Instant verified values from DB
    verifiedRobuxInstantDetails?: {
      robuxAmount: number;
      productName: string;
      description: string;
    };
    // Gamepass verified values from DB
    verifiedGamepassDetails?: {
      gameName: string;
      itemName: string;
      gamepassId: string;
      serviceImage: string;
      serviceName: string;
    };
  };
}> {
  const {
    serviceType,
    serviceId,
    serviceCategory,
    quantity: rawQuantity,
    rbx5Details,
    userId,
    paymentMethodId,
    gamepassDetails,
    serviceName,
  } = body;

  // 0. Validasi & enforce quantity dari server
  const quantityCheck = getVerifiedQuantity(
    serviceType,
    serviceCategory,
    rawQuantity,
  );
  if (!quantityCheck.valid) {
    return {
      valid: false,
      error: quantityCheck.error || "Quantity tidak valid",
      verified: {
        quantity: 0,
        unitPrice: 0,
        totalAmount: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmountBeforeFee: 0,
        paymentFee: 0,
        finalAmountWithFee: 0,
        paymentMethodName: null,
        validPaymentMethodId: null,
        paymentMethodDoc: null,
      },
    };
  }
  const quantity = quantityCheck.quantity;

  // 1. Validasi harga dari DB
  const priceCheck = await getVerifiedUnitPrice(
    serviceType,
    serviceId,
    serviceCategory,
    rbx5Details,
    quantity,
    gamepassDetails,
    serviceName,
  );

  if (!priceCheck.valid) {
    return {
      valid: false,
      error: priceCheck.error || "Harga tidak valid",
      verified: {
        quantity: 0,
        unitPrice: 0,
        totalAmount: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmountBeforeFee: 0,
        paymentFee: 0,
        finalAmountWithFee: 0,
        paymentMethodName: null,
        validPaymentMethodId: null,
        paymentMethodDoc: null,
      },
    };
  }

  const verifiedUnitPrice = priceCheck.unitPrice;

  // 2. Hitung total amount
  // Untuk rbx5, quantity selalu 1, unitPrice = total harga
  const verifiedTotalAmount =
    serviceType === "robux" &&
    (serviceCategory === "robux_5_hari" || rbx5Details)
      ? verifiedUnitPrice // unitPrice sudah total untuk rbx5
      : verifiedUnitPrice * (quantity || 1);

  // 3. Validasi diskon dari DB
  const discountCheck = await getVerifiedDiscount(userId);
  const verifiedDiscountPercentage = discountCheck.discountPercentage;
  const verifiedDiscountAmount = Math.round(
    (verifiedTotalAmount * verifiedDiscountPercentage) / 100,
  );
  const verifiedFinalAmountBeforeFee =
    verifiedTotalAmount - verifiedDiscountAmount;

  // 4. Validasi payment fee dari DB
  const feeCheck = await getVerifiedPaymentFee(
    paymentMethodId,
    verifiedFinalAmountBeforeFee,
  );
  const verifiedPaymentFee = feeCheck.fee;
  const verifiedFinalAmountWithFee =
    verifiedFinalAmountBeforeFee + verifiedPaymentFee;

  // Log perbandingan frontend vs backend
  console.log("=== SERVER-SIDE VALIDATION RESULTS ===");
  console.log(
    "Frontend unitPrice:",
    body.unitPrice,
    "→ DB:",
    verifiedUnitPrice,
  );
  console.log(
    "Frontend totalAmount:",
    body.totalAmount,
    "→ Calculated:",
    verifiedTotalAmount,
  );
  console.log(
    "Frontend discount%:",
    body.discountPercentage,
    "→ DB:",
    verifiedDiscountPercentage,
  );
  console.log(
    "Frontend discountAmount:",
    body.discountAmount,
    "→ Calculated:",
    verifiedDiscountAmount,
  );
  console.log(
    "Frontend finalAmount:",
    body.finalAmount,
    "→ Calculated:",
    verifiedFinalAmountWithFee,
  );
  console.log(
    "Frontend paymentFee:",
    body.paymentFee,
    "→ DB:",
    verifiedPaymentFee,
  );

  // Deteksi manipulasi (log warning jika ada perbedaan signifikan)
  if (body.unitPrice && Math.abs(body.unitPrice - verifiedUnitPrice) > 1) {
    console.warn(
      `⚠️ PRICE MISMATCH DETECTED! Frontend: ${body.unitPrice}, DB: ${verifiedUnitPrice}`,
    );
  }
  if (
    body.discountPercentage &&
    body.discountPercentage !== verifiedDiscountPercentage
  ) {
    console.warn(
      `⚠️ DISCOUNT MISMATCH DETECTED! Frontend: ${body.discountPercentage}%, DB: ${verifiedDiscountPercentage}%`,
    );
  }
  if (body.paymentFee && Math.abs(body.paymentFee - verifiedPaymentFee) > 1) {
    console.warn(
      `⚠️ PAYMENT FEE MISMATCH DETECTED! Frontend: ${body.paymentFee}, DB: ${verifiedPaymentFee}`,
    );
  }

  return {
    valid: true,
    verified: {
      quantity, // Server-verified quantity
      unitPrice: verifiedUnitPrice,
      totalAmount: verifiedTotalAmount,
      discountPercentage: verifiedDiscountPercentage,
      discountAmount: verifiedDiscountAmount,
      finalAmountBeforeFee: verifiedFinalAmountBeforeFee,
      paymentFee: verifiedPaymentFee,
      finalAmountWithFee: verifiedFinalAmountWithFee,
      paymentMethodName: feeCheck.paymentMethodName,
      validPaymentMethodId: feeCheck.validPaymentMethodId,
      paymentMethodDoc: feeCheck.paymentMethodDoc,
      // Rbx5 verified values from DB
      verifiedRobuxAmount: priceCheck.robuxAmount,
      verifiedGamepassAmount: priceCheck.gamepassAmount,
      verifiedPricePerHundred: priceCheck.pricePerHundred,
      // Reseller verified values from DB
      verifiedResellerDetails: priceCheck.verifiedResellerDetails,
      verifiedServiceName: priceCheck.verifiedServiceName,
      // Robux Instant verified values from DB
      verifiedRobuxInstantDetails: priceCheck.verifiedRobuxInstantDetails,
      // Gamepass verified values from DB
      verifiedGamepassDetails: priceCheck.verifiedGamepassDetails,
    },
  };
}

// ============================================================
// 5. Validasi item untuk multi-transaction
// ============================================================
export async function validateMultiTransactionItem(
  item: any,
  index: number,
): Promise<{
  valid: boolean;
  error?: string;
  verifiedQuantity: number; // Server-verified quantity
  verifiedUnitPrice: number;
  verifiedTotalAmount: number;
  verifiedRobuxAmount?: number;
  verifiedGamepassAmount?: number;
  verifiedPricePerHundred?: number;
  verifiedRobuxInstantDetails?: {
    robuxAmount: number;
    productName: string;
    description: string;
  };
  verifiedGamepassDetails?: {
    gameName: string;
    itemName: string;
    gamepassId: string;
    serviceImage: string;
    serviceName: string;
  };
}> {
  // 0. Validasi & enforce quantity dari server
  const quantityCheck = getVerifiedQuantity(
    item.serviceType,
    item.serviceCategory,
    item.quantity,
  );
  if (!quantityCheck.valid) {
    return {
      valid: false,
      error: `Item ${index + 1} (${item.serviceName}): ${quantityCheck.error}`,
      verifiedQuantity: 0,
      verifiedUnitPrice: 0,
      verifiedTotalAmount: 0,
    };
  }
  const verifiedQuantity = quantityCheck.quantity;

  const priceCheck = await getVerifiedUnitPrice(
    item.serviceType,
    item.serviceId,
    item.serviceCategory,
    item.rbx5Details,
    verifiedQuantity,
    item.gamepassDetails,
    item.serviceName,
  );

  if (!priceCheck.valid) {
    return {
      valid: false,
      error: `Item ${index + 1} (${item.serviceName}): ${priceCheck.error}`,
      verifiedQuantity: 0,
      verifiedUnitPrice: 0,
      verifiedTotalAmount: 0,
    };
  }

  const verifiedUnitPrice = priceCheck.unitPrice;

  // Untuk rbx5, quantity selalu 1, unitPrice = total harga
  const verifiedTotalAmount =
    item.serviceType === "robux" &&
    (item.serviceCategory === "robux_5_hari" || item.rbx5Details)
      ? verifiedUnitPrice
      : verifiedUnitPrice * verifiedQuantity;

  // Log jika ada perbedaan
  if (item.unitPrice && Math.abs(item.unitPrice - verifiedUnitPrice) > 1) {
    console.warn(
      `⚠️ PRICE MISMATCH on item ${index + 1} (${item.serviceName})! Frontend: ${item.unitPrice}, DB: ${verifiedUnitPrice}`,
    );
  }

  return {
    valid: true,
    verifiedQuantity,
    verifiedUnitPrice,
    verifiedTotalAmount,
    verifiedRobuxAmount: priceCheck.robuxAmount,
    verifiedGamepassAmount: priceCheck.gamepassAmount,
    verifiedPricePerHundred: priceCheck.pricePerHundred,
    verifiedRobuxInstantDetails: priceCheck.verifiedRobuxInstantDetails,
    verifiedGamepassDetails: priceCheck.verifiedGamepassDetails,
  };
}
