import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import { generateRoblox2FACode } from "@/utils/totp";
import { requireAdmin, requireApiKey } from "@/lib/auth";

/**
 * POST /api/admin/stock-accounts/setup-2fa
 *
 * Mengaktifkan TOTP 2FA secara otomatis pada akun Roblox yang belum memiliki 2FA,
 * lalu menyimpan secret key ke database.
 *
 * Body: { stockAccountId: string }
 */
export async function POST(req: NextRequest) {
  const apiKeyError = requireApiKey(req);
  if (apiKeyError) return apiKeyError;

  try {
    await requireAdmin(req);
  } catch (authError: any) {
    const status = authError.message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: authError.message }, { status });
  }

  try {
    const { stockAccountId } = await req.json();

    if (!stockAccountId) {
      return NextResponse.json(
        { success: false, message: "stockAccountId wajib diisi" },
        { status: 400 },
      );
    }

    await connectDB();

    const account = await StockAccount.findById(stockAccountId);
    if (!account) {
      return NextResponse.json(
        { success: false, message: "Stock account tidak ditemukan" },
        { status: 404 },
      );
    }

    // Jika sudah ada secret2fa, tidak perlu setup ulang
    if (account.secret2fa) {
      return NextResponse.json({
        success: true,
        alreadySetup: true,
        message: `Akun @${account.username} sudah memiliki secret 2FA, tidak perlu setup ulang.`,
        secret2fa: account.secret2fa,
      });
    }

    const robloxCookie = account.robloxCookie;
    const userId = account.userId;

    // ── STEP 1: Ambil CSRF Token ──────────────────────────────────────────────
    console.log(`🔑 [Setup2FA] Mengambil CSRF token untuk user ${userId}...`);

    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { Cookie: `.ROBLOSECURITY=${robloxCookie}` },
    });
    // BUG FIX: pakai `let` agar bisa diperbarui kalau dapat CSRF baru dari response 403
    let csrfToken = csrfRes.headers.get("x-csrf-token");

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, message: "Gagal mendapatkan CSRF token. Cookie mungkin expired." },
        { status: 500 },
      );
    }

    // ── STEP 2: Panggil endpoint setup TOTP ──────────────────────────────────
    console.log(`📲 [Setup2FA] Memulai setup TOTP untuk user ${userId}...`);

    let setupRes = await fetch(
      `https://twostepverification.roblox.com/v1/users/${userId}/configuration/authenticator/enable`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `.ROBLOSECURITY=${robloxCookie}`,
          "X-CSRF-TOKEN": csrfToken,
        },
      },
    );

    // Roblox mungkin mengembalikan 403 karena dua alasan:
    // A) CSRF expired → ada header x-csrf-token baru, retry
    // B) Challenge required → ada header rblx-challenge-id, perlu verifikasi dulu
    if (setupRes.status === 403) {
      const newCsrf = setupRes.headers.get("x-csrf-token");
      const challengeId = setupRes.headers.get("rblx-challenge-id");
      const challengeType = setupRes.headers.get("rblx-challenge-type");
      const challengeMetadata = setupRes.headers.get("rblx-challenge-metadata");

      console.log(`🔍 [Setup2FA] 403 response - challengeId: ${challengeId}, type: ${challengeType}, newCsrf: ${!!newCsrf}`);

      // Kasus A: hanya CSRF expired, tidak ada challenge
      if (newCsrf && !challengeId) {
        csrfToken = newCsrf;
        console.log("🔑 [Setup2FA] CSRF expired, retry dengan token baru...");
        setupRes = await fetch(
          `https://twostepverification.roblox.com/v1/users/${userId}/configuration/authenticator/enable`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `.ROBLOSECURITY=${robloxCookie}`,
              "X-CSRF-TOKEN": csrfToken,
            },
          },
        );
      }

      // Kasus B: Roblox meminta challenge (verifikasi identitas sebelum setup 2FA)
      if (challengeId && challengeType) {
        if (newCsrf) csrfToken = newCsrf;

        console.log(`🔒 [Setup2FA] Roblox meminta challenge: type=${challengeType}, id=${challengeId}`);

        // Parse metadata challenge jika ada
        let challengeMetadataParsed: any = {};
        if (challengeMetadata) {
          try {
            challengeMetadataParsed = JSON.parse(
              Buffer.from(challengeMetadata, "base64").toString("utf-8"),
            );
          } catch {}
        }

        // Challenge type bisa: "twostepverification", "email", "accountpin", dll.
        // Untuk akun yang BELUM punya 2FA, Roblox biasanya minta verifikasi email atau accountpin.
        // Kita tidak bisa mengotomatiskan ini tanpa akses ke email/PIN akun.
        const errBody = await setupRes.text().catch(() => "");
        console.error(`❌ [Setup2FA] Roblox membutuhkan challenge "${challengeType}" sebelum setup 2FA.`);
        console.error(`❌ [Setup2FA] Metadata challenge:`, JSON.stringify(challengeMetadataParsed));

        return NextResponse.json(
          {
            success: false,
            challengeRequired: true,
            challengeType: challengeType,
            challengeId: challengeId,
            message:
              challengeType === "email"
                ? `❌ Roblox membutuhkan verifikasi EMAIL sebelum mengaktifkan 2FA. Akun @${account.username} harus punya email yang terhubung dan bisa diakses untuk setup 2FA otomatis.`
                : challengeType === "accountpin"
                  ? `❌ Roblox membutuhkan PIN Akun sebelum mengaktifkan 2FA. Silakan masukkan account PIN akun @${account.username} secara manual terlebih dahulu.`
                  : `❌ Roblox membutuhkan verifikasi tambahan (${challengeType}) sebelum setup 2FA. Akun @${account.username} tidak dapat disetup secara otomatis. Silakan aktifkan 2FA secara manual di website Roblox, lalu masukkan secret key-nya di kolom "Secret 2FA" saat edit akun.`,
          },
          { status: 403 },
        );
      }
    }

    // Jika setelah semua handling setupRes masih tidak ok, return error
    if (!setupRes.ok) {
      const errBody = await setupRes.text();
      console.error(`❌ [Setup2FA] Gagal memulai setup: HTTP ${setupRes.status} - ${errBody}`);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal memulai setup 2FA: HTTP ${setupRes.status}. ${errBody}`,
        },
        { status: setupRes.status },
      );
    }

    const setupData = await setupRes.json();
    console.log("📋 [Setup2FA] Response setup:", JSON.stringify(setupData));

    // Roblox mengembalikan setupToken dan manual entry key (secret)
    // Format: { setupToken: "...", manualEntryKey: "BASE32SECRET..." }
    const setupToken: string = setupData.setupToken;
    const manualEntryKey: string = setupData.manualEntryKey;

    if (!setupToken || !manualEntryKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Roblox tidak mengembalikan setupToken atau manualEntryKey. Mungkin 2FA sudah aktif atau akun tidak mendukung.",
          raw: setupData,
        },
        { status: 500 },
      );
    }

    console.log(`✅ [Setup2FA] Setup token diterima. Manual entry key: ${manualEntryKey}`);

    // ── STEP 3: Generate kode TOTP menggunakan secret yang baru didapat ───────
    const code2fa = generateRoblox2FACode(manualEntryKey);
    console.log(`🔐 [Setup2FA] Kode TOTP yang di-generate: ${code2fa}`);

    // Helper: kirim request enable dengan CSRF token terkini
    async function doEnableRequest(code: string) {
      return await fetch(
        `https://twostepverification.roblox.com/v1/users/${userId}/configuration/authenticator/enable/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `.ROBLOSECURITY=${robloxCookie}`,
            "X-CSRF-TOKEN": csrfToken!, // selalu pakai csrfToken terkini
          },
          body: JSON.stringify({ setupToken, code }),
        },
      );
    }

    // ── STEP 4: Enable TOTP di akun ──────────────────────────────────────────
    console.log(`📤 [Setup2FA] Memverifikasi kode TOTP ke Roblox...`);
    let enableRes = await doEnableRequest(code2fa);

    // BUG FIX: selalu update csrfToken dari response 403, lalu retry
    if (enableRes.status === 403) {
      const newCsrf = enableRes.headers.get("x-csrf-token");
      if (newCsrf) {
        csrfToken = newCsrf; // BUG FIX: update ke variable, bukan hanya local
        console.log("🔑 [Setup2FA] CSRF token diperbarui dari enable response, retry...");
        enableRes = await doEnableRequest(code2fa);
      }
    }

    // Jika kode expired (bisa terjadi jika waktu tunggu mepet window 30 detik)
    if (!enableRes.ok && (enableRes.status === 400 || enableRes.status === 422)) {
      const errBodyRetry = await enableRes.text();
      console.log(`🔄 [Setup2FA] Kode TOTP mungkin expired (${enableRes.status}: ${errBodyRetry}). Menunggu window baru & retry...`);

      // Tunggu sampai awal window 30 detik berikutnya
      await new Promise((r) => setTimeout(r, 3000));
      const newCode = generateRoblox2FACode(manualEntryKey);
      console.log(`🔐 [Setup2FA] Kode TOTP baru: ${newCode}`);
      enableRes = await doEnableRequest(newCode);
    }

    if (!enableRes.ok) {
      const errBody = await enableRes.text();
      console.error(`❌ [Setup2FA] Gagal mengaktifkan 2FA: HTTP ${enableRes.status} - ${errBody}`);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mengaktifkan 2FA: HTTP ${enableRes.status}. ${errBody}`,
        },
        { status: 500 },
      );
    }

    console.log(`✅ [Setup2FA] 2FA berhasil diaktifkan untuk @${account.username}!`);

    // ── STEP 5: Simpan secret ke database ────────────────────────────────────
    account.secret2fa = manualEntryKey;
    await account.save();

    console.log(`💾 [Setup2FA] Secret 2FA berhasil disimpan ke database.`);

    return NextResponse.json({
      success: true,
      alreadySetup: false,
      message: `✅ 2FA berhasil diaktifkan dan secret tersimpan untuk akun @${account.username}!`,
      username: account.username,
      secret2fa: manualEntryKey,
    });
  } catch (error: any) {
    console.error("❌ [Setup2FA] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
