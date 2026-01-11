"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Mail, Shield, Lock, CheckCircle, ArrowLeft } from "lucide-react";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Start resend timer
  const startResendTimer = () => {
    setCanResendOTP(false);
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResendOTP(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email harus diisi");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim OTP");
      }

      toast.success("Kode OTP telah dikirim ke email Anda!");
      setStep("otp");
      startResendTimer();
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat mengirim OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);
    setError("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP input keydown
  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle paste OTP
  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOTP = pastedData.split("");
      setOtpCode(newOTP);
      const lastInput = document.getElementById("otp-5");
      lastInput?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otpCode.join("");

    if (otpString.length !== 6) {
      setError("Silakan masukkan kode OTP lengkap");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kode OTP tidak valid");
      }

      toast.success("Kode OTP valid!");
      setStep("reset");
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat verifikasi OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim ulang OTP");
      }

      toast.success("Kode OTP baru telah dikirim!");
      setOtpCode(["", "", "", "", "", ""]);
      startResendTimer();
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat mengirim ulang OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Semua field harus diisi");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpCode.join(""),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal reset password");
      }

      toast.success("Password berhasil direset!");
      setStep("success");
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden p-4">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-bg-primary"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "700ms" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1000ms" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="RBXNET Logo"
              width={80}
              height={32}
              className="object-contain mx-auto"
            />
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="neon-card rounded-2xl p-8 backdrop-blur-xl border border-neon-pink/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Step: Email */}
          {step === "email" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neon-pink/30">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Lupa Password?
                </h1>
                <p className="text-white/60 text-sm">
                  Masukkan email Anda dan kami akan mengirimkan kode OTP untuk
                  reset password
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-300 border-2 outline-none focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-primary-800 ${
                    isLoading
                      ? "bg-gray-600 cursor-not-allowed border-gray-500"
                      : "bg-gradient-to-r from-neon-pink to-neon-purple border-neon-pink/50 hover:border-neon-pink hover:shadow-xl hover:shadow-neon-pink/50 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Mengirim OTP...</span>
                    </div>
                  ) : (
                    "KIRIM KODE OTP"
                  )}
                </button>

                <p className="text-center text-sm text-white/60">
                  Ingat password?{" "}
                  <Link
                    href="/login"
                    className="text-neon-pink hover:text-neon-pink/80 font-semibold transition-colors duration-300"
                  >
                    Masuk Sekarang
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* Step: OTP Verification */}
          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neon-pink/30">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Verifikasi OTP
                </h1>
                <p className="text-white/60 text-sm">
                  Masukkan kode 6 digit yang dikirim ke{" "}
                  <span className="text-neon-pink font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* OTP Input */}
                <div
                  className="flex justify-center gap-2"
                  onPaste={handleOTPPaste}
                >
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-neon-pink transition-all duration-300"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-300 border-2 outline-none focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-primary-800 ${
                    isLoading
                      ? "bg-gray-600 cursor-not-allowed border-gray-500"
                      : "bg-gradient-to-r from-neon-pink to-neon-purple border-neon-pink/50 hover:border-neon-pink hover:shadow-xl hover:shadow-neon-pink/50 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Memverifikasi...</span>
                    </div>
                  ) : (
                    "VERIFIKASI"
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {canResendOTP ? (
                    <button
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-neon-pink hover:text-neon-pink/80 font-medium transition-colors duration-300 outline-none focus:outline-none focus:ring-2 focus:ring-neon-pink focus:ring-offset-2 focus:ring-offset-primary-800 rounded-lg px-2 py-1"
                    >
                      Kirim Ulang OTP
                    </button>
                  ) : (
                    <p className="text-white/50 text-sm">
                      Kirim ulang OTP dalam{" "}
                      <span className="text-neon-pink font-medium">
                        {resendTimer}s
                      </span>
                    </p>
                  )}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => {
                    setStep("email");
                    setOtpCode(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white/60 hover:text-white transition-colors duration-300 border-2 border-white/20 hover:border-white/40 rounded-xl outline-none focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-primary-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              </div>
            </>
          )}

          {/* Step: Reset Password */}
          {step === "reset" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neon-pink/30">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-white/60 text-sm">
                  Buat password baru untuk akun Anda
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-transparent transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/70 transition-colors duration-300"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757M12 12l2.122 2.122m0 0L16.243 16.243M12 12L9.878 14.122m2.122-2.122L16.243 7.757"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-transparent transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/70 transition-colors duration-300"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757M12 12l2.122 2.122m0 0L16.243 16.243M12 12L9.878 14.122m2.122-2.122L16.243 7.757"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-300 border-2 outline-none focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-primary-800 ${
                    isLoading
                      ? "bg-gray-600 cursor-not-allowed border-gray-500"
                      : "bg-gradient-to-r from-neon-pink to-neon-purple border-neon-pink/50 hover:border-neon-pink hover:shadow-xl hover:shadow-neon-pink/50 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </div>
                  ) : (
                    "RESET PASSWORD"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-400/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Password Berhasil Direset! 🎉
                </h1>
                <p className="text-white/60 text-sm mb-8">
                  Password Anda telah berhasil diperbarui. Silakan login dengan
                  password baru Anda.
                </p>

                <Link
                  href="/login"
                  className="inline-block w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-neon-pink to-neon-purple border-2 border-neon-pink/50 hover:border-neon-pink hover:shadow-xl hover:shadow-neon-pink/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-center"
                >
                  MASUK SEKARANG
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-white/40 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          © {new Date().getFullYear()} RBXNET. All rights reserved.
        </motion.p>
      </div>
    </motion.div>
  );
}
