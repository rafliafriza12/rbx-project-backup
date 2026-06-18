import * as OTPAuth from "otpauth";

/**
 * Menghasilkan kode 6 digit TOTP berdasarkan secret key
 * @param secretKey Secret key dari Roblox 2FA (contoh: JUZ5JERKQ63U3BC2UMSEULE6KY)
 * @returns Kode 6 digit berbentuk string (contoh: "123456")
 */
export function generateRoblox2FACode(secretKey: string): string {
  if (!secretKey) {
    throw new Error("Secret key is required to generate 2FA code");
  }

  // Menghapus spasi jika ada
  const cleanSecret = secretKey.replace(/\s+/g, "");

  const totp = new OTPAuth.TOTP({
    issuer: "Roblox",
    label: "RobuxBot",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(cleanSecret),
  });

  return totp.generate();
}
