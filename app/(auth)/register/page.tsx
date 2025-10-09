"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { Gem, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+62",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const countries = [
    { code: "+62", name: "Indonesia", flag: "🇮🇩" },
    { code: "+1", name: "United States", flag: "🇺🇸" },
    { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "+65", name: "Singapore", flag: "🇸🇬" },
    { code: "+60", name: "Malaysia", flag: "🇲🇾" },
    { code: "+66", name: "Thailand", flag: "🇹🇭" },
    { code: "+84", name: "Vietnam", flag: "🇻🇳" },
    { code: "+63", name: "Philippines", flag: "🇵🇭" },
    { code: "+86", name: "China", flag: "🇨🇳" },
    { code: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "+82", name: "South Korea", flag: "🇰🇷" },
    { code: "+91", name: "India", flag: "🇮🇳" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan!");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      // Registration successful, user will be redirected by AuthContext
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat mendaftar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden p-4">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-bg-primary"></div>

        {/* Animated neon circles */}
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

      {/* Close button */}
      <Link
        href="/"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:border-neon-pink/50 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 z-20"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </Link>

      {/* Main Content - Split Layout */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left Side - Branding */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center lg:justify-start mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink to-neon-purple rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-neon-pink to-neon-purple rounded-2xl flex items-center justify-center shadow-2xl shadow-neon-pink/50">
                <Gem className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Bergabung dengan <span className="text-neon-pink">RBXNET</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md mx-auto lg:mx-0">
              Platform terpercaya untuk jasa{" "}
              <span className="text-neon-pink font-semibold">Robux</span>,{" "}
              <span className="text-neon-purple font-semibold">Gamepass</span>,
              dan{" "}
              <span className="text-neon-pink font-semibold">Joki Roblox</span>
            </p>
          </div>

          {/* Features List */}
          <div className="hidden lg:grid grid-cols-1 gap-3 pt-4">
            <div className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-neon-pink" />
              <span className="text-sm">Transaksi Cepat & Aman</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-neon-pink" />
              <span className="text-sm">Harga Terjangkau</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-neon-pink" />
              <span className="text-sm">Customer Service 24/7</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-neon-pink/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              MASUK
            </button>
            <button
              onClick={() => router.push("/register")}
              className="px-8 py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold rounded-xl hover:shadow-xl hover:shadow-neon-pink/50 transition-all duration-300 hover:scale-105"
            >
              DAFTAR
            </button>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink/30 to-neon-purple/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            {/* Form container */}
            <div className="relative bg-primary-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Buat Akun Baru
                </h2>
                <p className="text-white/60 text-sm">
                  Lengkapi data diri Anda untuk mendaftar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                    <span>{error}</span>
                  </div>
                )}

                {/* Google Register Button */}
                <GoogleAuthButton mode="register" onError={handleGoogleError} />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-primary-800 text-white/50">
                      atau
                    </span>
                  </div>
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Nama Pengguna
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                      placeholder="Username"
                      required
                    />
                  </div>
                </div>

                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                    placeholder="Masukkan email"
                    required
                  />
                </div>

                {/* Phone field */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Nomor Handphone
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                    >
                      {countries.map((country) => (
                        <option
                          key={country.code}
                          value={country.code}
                          className="bg-primary-800 text-white"
                        >
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                      placeholder="Masukkan nomor"
                      required
                    />
                  </div>
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                        placeholder="Buat password"
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

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-neon-pink focus:border-neon-pink outline-none transition-all duration-300"
                        placeholder="Konfirmasi password"
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
                </div>

                {/* Terms agreement */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-neon-pink bg-white/5 border-white/20 rounded focus:ring-neon-pink focus:ring-2 mt-1"
                    required
                  />
                  <label
                    htmlFor="agreeToTerms"
                    className="ml-2 text-sm text-white/70"
                  >
                    Saya menyetujui{" "}
                    <Link
                      href="/terms"
                      className="text-neon-pink hover:text-neon-pink/80 underline transition-colors duration-300"
                    >
                      Syarat dan Ketentuan
                    </Link>{" "}
                    serta{" "}
                    <Link
                      href="/privacy"
                      className="text-neon-pink hover:text-neon-pink/80 underline transition-colors duration-300"
                    >
                      Kebijakan Privasi
                    </Link>
                  </label>
                </div>

                {/* Register button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-300 ${
                    isLoading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-primary-100/80 hover:shadow-xl hover:shadow-neon-pink/50 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      MENDAFTAR...
                    </div>
                  ) : (
                    "DAFTAR"
                  )}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-white/60">
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="text-neon-pink hover:text-neon-pink/80 font-semibold transition-colors duration-300"
                  >
                    Masuk Sekarang
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
