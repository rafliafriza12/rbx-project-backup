import dbConnect from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import Transaction from "@/models/Transaction";
import PurchaseRun from "@/models/PurchaseRun";
import Rbx5Stats from "@/models/Rbx5Stats";

/**
 * Roblox failureReason code mapping
 * 1  = jumlah tidak valid
 * 6  = SENDER lewat limit kirim
 * 13 = SENDER diblokir (butuh verifikasi / consent) ← akun <16 mentok di sini
 * 19 = RECIPIENT lewat limit terima
 */
export const ROBUX_TRANSFER_FAILURE_REASONS: Record<number, string> = {
  1: "Jumlah robux tidak valid (failureReason: 1)",
  6: "SENDER lewat limit kirim (akun pengirim melewati batas transfer robux) (failureReason: 6)",
  13: "SENDER diblokir (butuh verifikasi / consent identitas) ← akun <16 tahun mentok di sini (failureReason: 13)",
  19: "RECIPIENT lewat limit terima (akun penerima melewati batas terima robux) (failureReason: 19)",
};

/**
 * Format .ROBLOSECURITY cookie
 */
export function formatRobloxCookie(cookie: string): string {
  if (!cookie) return "";
  let clean = cookie.trim();
  if (clean.startsWith(".ROBLOSECURITY=")) {
    clean = clean.replace(".ROBLOSECURITY=", "").trim();
  }
  return clean;
}

/**
 * make_session(cookie):
 * Mengambil x-csrf-token via POST https://auth.roblox.com/v2/logout
 */
export async function getRobloxCsrfToken(cookie: string): Promise<string> {
  const cleanCookie = formatRobloxCookie(cookie);
  if (!cleanCookie) {
    throw new Error("Cookie Roblox tidak boleh kosong");
  }

  try {
    const res = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: {
        Cookie: `.ROBLOSECURITY=${cleanCookie}`,
      },
    });

    const csrfToken = res.headers.get("x-csrf-token");
    if (!csrfToken) {
      throw new Error(`CSRF token tidak ditemukan di response headers (HTTP ${res.status})`);
    }

    return csrfToken;
  } catch (err: any) {
    throw new Error(`Gagal mengambil x-csrf-token: ${err.message}`);
  }
}

/**
 * resolve_user(username):
 * POST https://users.roblox.com/v1/usernames/users {"usernames":[username]}
 * → recipientId
 */
export async function resolveRobloxUser(username: string): Promise<{
  recipientId: number;
  username: string;
  displayName: string;
}> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error("Username Roblox tidak boleh kosong");
  }

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      usernames: [cleanUsername],
      excludeBannedUsers: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal resolve username Roblox: HTTP ${res.status}`);
  }

  const data = await res.json();
  const user = data?.data?.[0];

  if (!user || !user.id) {
    throw new Error(`Username Roblox "${cleanUsername}" tidak ditemukan`);
  }

  return {
    recipientId: user.id,
    username: user.name || cleanUsername,
    displayName: user.displayName || cleanUsername,
  };
}

/**
 * initiate-transfer:
 * POST https://apis.roblox.com/transfer/v1/robux-transfer/initiate-transfer
 * body {"recipientId": rid}
 * → RXT token (handle untuk transfer)
 */
export async function initiateRobuxTransfer(
  cookie: string,
  csrfToken: string,
  recipientId: number,
): Promise<{
  rxtId: string;
  newCsrf?: string;
  rawResponse: any;
}> {
  const cleanCookie = formatRobloxCookie(cookie);

  let currentCsrf = csrfToken;
  let res = await fetch("https://apis.roblox.com/transfer/v1/robux-transfer/initiate-transfer", {
    method: "POST",
    headers: {
      Cookie: `.ROBLOSECURITY=${cleanCookie}`,
      "x-csrf-token": currentCsrf,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      recipientId: Number(recipientId),
    }),
  });

  // Handle CSRF token refresh jika 403
  if (res.status === 403) {
    const refreshedCsrf = res.headers.get("x-csrf-token");
    if (refreshedCsrf) {
      currentCsrf = refreshedCsrf;
      res = await fetch("https://apis.roblox.com/transfer/v1/robux-transfer/initiate-transfer", {
        method: "POST",
        headers: {
          Cookie: `.ROBLOSECURITY=${cleanCookie}`,
          "x-csrf-token": currentCsrf,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipientId: Number(recipientId),
        }),
      });
    }
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawText: text };
  }

  if (!res.ok) {
    // Cek jika ada failureReason di response
    if (data?.failureReason !== undefined && data?.failureReason !== null) {
      const code = Number(data.failureReason);
      const reasonMsg = ROBUX_TRANSFER_FAILURE_REASONS[code] || `Initiate transfer gagal (failureReason: ${code})`;
      const err: any = new Error(reasonMsg);
      err.failureReasonCode = code;
      err.rawResponse = data;
      throw err;
    }
    const errMsg = data?.errors?.[0]?.message || data?.message || `Initiate transfer error: HTTP ${res.status}`;
    const err: any = new Error(errMsg);
    err.rawResponse = data;
    throw err;
  }

  // Ambil RXT token / handle dari response
  // Roblox API sebenarnya mengembalikan: {"transferRequestId":"RXT-xxx","robuxTransfer":{"transferId":...}}
  const rxtId =
    data?.transferRequestId ||        // ← Field asli Roblox API
    data?.id ||
    data?.rxtId ||
    data?.rxtToken ||
    data?.token ||
    data?.transferToken ||
    data?.robuxTransfer?.transferId || // ← Fallback: pakai transferId dari nested object
    data?.data?.transferRequestId ||
    data?.data?.id ||
    data?.data?.rxtToken ||
    (typeof data === "string" ? data : "");

  if (!rxtId) {
    throw new Error(`Tidak menerima token transfer RXT dari Roblox (Response: ${text.slice(0, 200)})`);
  }

  console.log(`[Robux Transfer] RXT token diterima: ${String(rxtId).slice(0, 50)}`);

  return {
    rxtId: String(rxtId),
    newCsrf: currentCsrf !== csrfToken ? currentCsrf : undefined,
    rawResponse: data,
  };
}

/**
 * process-transfer:
 * POST https://apis.roblox.com/transfer/v1/robux-transfer/process-transfer/{RXT}
 * body {"robuxAmount": int(amount)}   ← field "robuxAmount", BUKAN "transferAmount"
 *
 * Baca hasil:
 * success → catat di purchase_runs
 * failureReason:
 *   1  = jumlah tidak valid
 *   6  = SENDER lewat limit kirim
 *   13 = SENDER diblokir (butuh verifikasi / consent) ← akun <16 mentok di sini
 *   19 = RECIPIENT lewat limit terima
 */
export async function processRobuxTransfer(
  cookie: string,
  csrfToken: string,
  rxtId: string,
  robuxAmount: number,
): Promise<{
  success: boolean;
  failureReasonCode?: number;
  failureReason?: string;
  newCsrf?: string;
  rawResponse: any;
}> {
  const cleanCookie = formatRobloxCookie(cookie);
  const targetUrl = `https://apis.roblox.com/transfer/v1/robux-transfer/process-transfer/${encodeURIComponent(rxtId)}`;

  let currentCsrf = csrfToken;
  let res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Cookie: `.ROBLOSECURITY=${cleanCookie}`,
      "x-csrf-token": currentCsrf,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      robuxAmount: Math.floor(Number(robuxAmount)),
    }),
  });

  // Handle CSRF refresh jika 403
  if (res.status === 403) {
    const refreshedCsrf = res.headers.get("x-csrf-token");
    if (refreshedCsrf) {
      currentCsrf = refreshedCsrf;
      res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Cookie: `.ROBLOSECURITY=${cleanCookie}`,
          "x-csrf-token": currentCsrf,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          robuxAmount: Math.floor(Number(robuxAmount)),
        }),
      });
    }
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawText: text };
  }

  // Cek kegagalan melalui failureReason
  if (data?.failureReason !== undefined && data?.failureReason !== null && Number(data.failureReason) !== 0) {
    const code = Number(data.failureReason);
    const reasonText = ROBUX_TRANSFER_FAILURE_REASONS[code] || `Transfer gagal (failureReason: ${code})`;
    return {
      success: false,
      failureReasonCode: code,
      failureReason: reasonText,
      newCsrf: currentCsrf !== csrfToken ? currentCsrf : undefined,
      rawResponse: data,
    };
  }

  // Cek kegagalan melalui HTTP status
  if (!res.ok) {
    let code: number | undefined = undefined;
    let message = `Roblox API error: HTTP ${res.status}`;

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const errObj = data.errors[0];
      if (errObj.code) code = Number(errObj.code);
      message = (code && ROBUX_TRANSFER_FAILURE_REASONS[code]) || errObj.message || message;
    } else if (data?.message) {
      message = data.message;
    }

    return {
      success: false,
      failureReasonCode: code,
      failureReason: message,
      newCsrf: currentCsrf !== csrfToken ? currentCsrf : undefined,
      rawResponse: data,
    };
  }

  // Jika response OK dan tidak ada failureReason
  return {
    success: true,
    newCsrf: currentCsrf !== csrfToken ? currentCsrf : undefined,
    rawResponse: data,
  };
}

export interface DirectTransferParams {
  cookie: string;
  username: string;
  robuxAmount: number;
  stockAccountId?: string;
  stockAccountUsername?: string;
  invoiceId?: string;
  transactionId?: string;
  executedBy?: string;
}

export interface DirectTransferResult {
  success: boolean;
  recipientId?: number;
  recipientUsername: string;
  robuxAmount: number;
  rxtToken?: string;
  failureReasonCode?: number;
  failureReason?: string;
  purchaseRunId?: string;
  rawResponse?: any;
}

/**
 * Orchestrator untuk transfer Robux Instant langsung:
 * 1. resolve_user
 * 2. make_session (csrf token)
 * 3. initiate-transfer -> RXT token
 * 4. process-transfer -> execute
 * 5. catat di purchase_runs
 */
export async function executeRobuxTransfer(
  params: DirectTransferParams,
): Promise<DirectTransferResult> {
  await dbConnect();

  const {
    cookie,
    username,
    robuxAmount,
    stockAccountId,
    stockAccountUsername,
    invoiceId,
    transactionId,
    executedBy = "system",
  } = params;

  let recipientId = 0;
  let resolvedUsername = username.trim();
  let rxtToken = "";

  try {
    // 1. Resolve user
    const resolved = await resolveRobloxUser(resolvedUsername);
    recipientId = resolved.recipientId;
    resolvedUsername = resolved.username;

    // 2. Make session (get csrf token)
    const csrfToken = await getRobloxCsrfToken(cookie);

    // 3. Initiate transfer
    const initiateRes = await initiateRobuxTransfer(cookie, csrfToken, recipientId);
    rxtToken = initiateRes.rxtId;
    const activeCsrf = initiateRes.newCsrf || csrfToken;

    // 4. Process transfer
    const processRes = await processRobuxTransfer(cookie, activeCsrf, rxtToken, robuxAmount);

    if (processRes.success) {
      // 5. Catat di purchase_runs (success)
      const purchaseRun = await PurchaseRun.create({
        invoiceId,
        transactionId,
        serviceType: "robux_instant",
        stockAccountId,
        stockAccountUsername,
        recipientUsername: resolvedUsername,
        recipientId,
        robuxAmount,
        rxtToken,
        status: "success",
        responseDetails: processRes.rawResponse,
        executedBy,
        executedAt: new Date(),
      });

      return {
        success: true,
        recipientId,
        recipientUsername: resolvedUsername,
        robuxAmount,
        rxtToken,
        purchaseRunId: purchaseRun._id.toString(),
        rawResponse: processRes.rawResponse,
      };
    } else {
      // Catat di purchase_runs (failed)
      const purchaseRun = await PurchaseRun.create({
        invoiceId,
        transactionId,
        serviceType: "robux_instant",
        stockAccountId,
        stockAccountUsername,
        recipientUsername: resolvedUsername,
        recipientId,
        robuxAmount,
        rxtToken,
        status: "failed",
        failureReasonCode: processRes.failureReasonCode,
        failureReason: processRes.failureReason,
        responseDetails: processRes.rawResponse,
        executedBy,
        executedAt: new Date(),
      });

      return {
        success: false,
        recipientId,
        recipientUsername: resolvedUsername,
        robuxAmount,
        rxtToken,
        failureReasonCode: processRes.failureReasonCode,
        failureReason: processRes.failureReason,
        purchaseRunId: purchaseRun._id.toString(),
        rawResponse: processRes.rawResponse,
      };
    }
  } catch (err: any) {
    const failureCode = err.failureReasonCode || undefined;
    const failureMsg = err.message || "Unknown transfer error";

    // Catat kegagalan di purchase_runs
    let purchaseRunId: string | undefined = undefined;
    try {
      if (recipientId > 0) {
        const run = await PurchaseRun.create({
          invoiceId,
          transactionId,
          serviceType: "robux_instant",
          stockAccountId,
          stockAccountUsername,
          recipientUsername: resolvedUsername,
          recipientId,
          robuxAmount,
          rxtToken: rxtToken || undefined,
          status: "failed",
          failureReasonCode: failureCode,
          failureReason: failureMsg,
          responseDetails: err.rawResponse || { error: failureMsg },
          executedBy,
          executedAt: new Date(),
        });
        purchaseRunId = run._id.toString();
      }
    } catch (saveErr) {
      console.error("[Robux Transfer] Gagal menyimpan failed purchase run:", saveErr);
    }

    return {
      success: false,
      recipientId: recipientId || undefined,
      recipientUsername: resolvedUsername,
      robuxAmount,
      rxtToken: rxtToken || undefined,
      failureReasonCode: failureCode,
      failureReason: failureMsg,
      purchaseRunId,
      rawResponse: err.rawResponse,
    };
  }
}

/**
 * Otomatis memproses transfer Robux Instant untuk sebuah Transaksi:
 * 1. Ambil transaksi dari database
 * 2. Cari akun stock yang aktif & mencukupi robux
 * 3. Eksekusi transfer
 * 4. Kurangi saldo robux akun stock
 * 5. Update status transaksi menjadi completed / bermasalah
 */
export async function autoTransferInstantRobux(
  transactionIdOrDoc: string | any,
  options?: {
    specificStockAccountId?: string;
    executedBy?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  transaction?: any;
  purchaseRun?: any;
}> {
  await dbConnect();

  let transaction: any = null;
  if (typeof transactionIdOrDoc === "string") {
    transaction = await Transaction.findById(transactionIdOrDoc);
  } else {
    transaction = transactionIdOrDoc;
  }

  if (!transaction) {
    return { success: false, message: "Transaksi tidak ditemukan" };
  }

  // Cegah transfer ganda jika sudah completed
  if (transaction.orderStatus === "completed") {
    return {
      success: true,
      message: `Transaksi ${transaction.invoiceId} sudah completed sebelumnya`,
      transaction,
    };
  }

  const username = transaction.robloxUsername?.trim();
  if (!username) {
    await transaction.updateStatus(
      "order",
      "bermasalah",
      "Gagal kirim Robux Instant: Username Roblox tidak ada",
      null,
    );
    return {
      success: false,
      message: "Username Roblox pada transaksi tidak ada",
    };
  }

  const robuxAmount =
    transaction.robuxInstantDetails?.robuxAmount ||
    transaction.quantity ||
    transaction.totalAmount ||
    0;

  if (robuxAmount <= 0) {
    await transaction.updateStatus(
      "order",
      "bermasalah",
      "Gagal kirim Robux Instant: Jumlah Robux 0 atau tidak valid",
      null,
    );
    return {
      success: false,
      message: "Jumlah Robux tidak valid",
    };
  }

  // Cari akun stock yang tersedia
  let suitableAccounts: any[] = [];
  if (options?.specificStockAccountId) {
    const specific = await StockAccount.findById(options.specificStockAccountId);
    if (specific && specific.status === "active" && specific.robux >= robuxAmount) {
      suitableAccounts = [specific];
    }
  }

  if (suitableAccounts.length === 0) {
    // Tentukan tipe akun berdasarkan serviceCategory transaksi
    // robux_username → hanya pakai akun bertipe "username"
    // robux_instant / lainnya → hanya pakai akun bertipe "gamepass" (atau akun lama tanpa field accountType)
    const isRobuxUsernameTransfer =
      transaction.serviceCategory === "robux_username" ||
      ((transaction.serviceType === "robux_instant" ||
        transaction.serviceCategory === "robux_instant") &&
        !transaction.robloxPassword);

    const requiredAccountType = isRobuxUsernameTransfer ? "username" : "gamepass";

    // Cari semua akun aktif dengan saldo cukup dan tipe yang sesuai
    // Untuk gamepass: inklusif akun lama yang belum punya field accountType
    // Prioritaskan akun yang isRobuxPlus = true, lalu sort robux ascending
    const accountTypeFilter =
      requiredAccountType === "gamepass"
        ? { $or: [{ accountType: "gamepass" }, { accountType: { $exists: false } }, { accountType: null }] }
        : { accountType: "username" };

    suitableAccounts = await StockAccount.find({
      status: "active",
      robux: { $gte: robuxAmount },
      ...accountTypeFilter,
    }).sort({ isRobuxPlus: -1, robux: 1 });

    console.log(`[Robux Transfer] Mencari akun tipe "${requiredAccountType}" dengan robux >= ${robuxAmount}. Ditemukan: ${suitableAccounts.length} akun.`);
  }

  if (suitableAccounts.length === 0) {
    console.warn(`[Robux Transfer] Tidak ada stock account yang memiliki >= ${robuxAmount} Robux`);
    await transaction.updateStatus(
      "order",
      "pending",
      `Menunggu stok akun (dibutuhkan ${robuxAmount} Robux)`,
      null,
    );
    return {
      success: false,
      message: `Tidak ada akun stock aktif dengan saldo mencukupi (${robuxAmount} Robux diperlukan)`,
    };
  }

  let lastError = "";
  let transferSuccess = false;
  let successfulAccount: any = null;
  let successfulResult: DirectTransferResult | null = null;

  for (const account of suitableAccounts) {
    console.log(`[Robux Transfer] Mencoba transfer menggunakan akun stock @${account.username} (Robux: ${account.robux})...`);

    const result = await executeRobuxTransfer({
      cookie: account.robloxCookie,
      username,
      robuxAmount,
      stockAccountId: account._id.toString(),
      stockAccountUsername: account.username,
      invoiceId: transaction.invoiceId,
      transactionId: transaction._id.toString(),
      executedBy: options?.executedBy || "system",
    });

    if (result.success) {
      transferSuccess = true;
      successfulAccount = account;
      successfulResult = result;
      break;
    } else {
      lastError = result.failureReason || "Gagal transfer";
      console.warn(`[Robux Transfer] Akun @${account.username} gagal: ${lastError}`);

      // Jika failureReason 13 (SENDER diblokir / butuh verifikasi), atau 6 (SENDER lewat limit)
      // Coba akun berikutnya di loop!
      if (result.failureReasonCode === 13 || result.failureReasonCode === 6) {
        continue;
      }

      // Jika failureReason 19 (RECIPIENT lewat limit terima) atau 1 (jumlah tidak valid),
      // mencoba akun lain tidak akan membantu karena masalah ada di penerima / nominal
      if (result.failureReasonCode === 19 || result.failureReasonCode === 1) {
        break;
      }
    }
  }

  if (transferSuccess && successfulAccount && successfulResult) {
    // 1. Kurangi saldo akun stock
    successfulAccount.robux = Math.max(0, successfulAccount.robux - robuxAmount);
    successfulAccount.lastChecked = new Date();
    await successfulAccount.save();
    console.log(`[Robux Transfer] Saldo @${successfulAccount.username} dikurangi ${robuxAmount} → Sisa ${successfulAccount.robux}`);

    // 2. Update status transaksi menjadi completed
    transaction.orderStatus = "completed";
    transaction.completedAt = new Date();

    // Update detail robux instant di transaksi
    if (!transaction.robuxInstantDetails) {
      transaction.robuxInstantDetails = {};
    }
    transaction.robuxInstantDetails.recipientId = successfulResult.recipientId;
    transaction.robuxInstantDetails.rxtToken = successfulResult.rxtToken;
    transaction.robuxInstantDetails.stockAccountId = successfulAccount._id;
    transaction.robuxInstantDetails.stockAccountUsername = successfulAccount.username;
    transaction.robuxInstantDetails.transferredAt = new Date();
    transaction.robuxInstantDetails.transferStatus = "success";
    transaction.robuxInstantDetails.failureReasonCode = undefined;
    transaction.robuxInstantDetails.transferError = undefined;

    // Catat di statusHistory
    transaction.statusHistory.push({
      status: "completed",
      notes: `Robux Instant (${robuxAmount} Robux) berhasil dikirim langsung ke @${username}`,
      updatedBy: options?.executedBy || "system",
      timestamp: new Date(),
    });

    await transaction.save();

    // 3. Update stats jika model Rbx5Stats ada
    try {
      await Rbx5Stats.recordPurchase(robuxAmount, 1);
    } catch (statsErr) {
      console.warn("[Robux Transfer] Gagal update Rbx5Stats:", statsErr);
    }

    return {
      success: true,
      message: `Robux Instant berhasil dikirim ke @${username} (${robuxAmount} Robux)`,
      transaction,
      purchaseRun: successfulResult,
    };
  } else {
    // Gagal untuk semua akun
    await transaction.updateStatus(
      "order",
      "bermasalah",
      `Kirim Robux Instant gagal: ${lastError}`,
      null,
    );

    if (transaction.robuxInstantDetails) {
      transaction.robuxInstantDetails.transferStatus = "failed";
      transaction.robuxInstantDetails.transferError = lastError;
    }

    return {
      success: false,
      message: `Transfer gagal: ${lastError}`,
      transaction,
    };
  }
}
