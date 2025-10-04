"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import GoogleAuthButton from "@/components/GoogleAuthButton";

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
    <div className="min-h-screen flex bg-gradient-to-br from-[#22102A] via-[#22102A] to-[#3D1A78]">
      {/* Left side - Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        {/* Close button */}
        <Link
          href="/"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-primary-100 to-primary-200 text-white rounded-full transition-all duration-300 hover:from-primary-100/80 hover:to-primary-200/80 hover:scale-110 shadow-lg shadow-primary-100/25"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Link>

        {/* RID Logo */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Image
            src="/logo.png"
            alt="RID Logo"
            width={60}
            height={24}
            className="object-contain"
          />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              DAFTAR
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Buat akun RobuxID untuk mulai berbelanja
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 ">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Lastname"
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
                Alamat Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="Masukkan alamat email"
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="px-3 py-3 bg-white/5 border border-white/20 rounded-lg sm:rounded-r-none text-white focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                >
                  {countries.map((country) => (
                    <option
                      key={country.code}
                      value={country.code}
                      className="bg-[#22102A] text-white"
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
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 border-l-0 sm:border-l-0 rounded-lg sm:rounded-l-none text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Masukkan nomor handphone"
                  required
                />
              </div>
            </div>

            {/* Password field */}

            {/* Confirm Password field */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/80 mb-2"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                    placeholder="Buat kata sandi"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white/80 transition-colors duration-300"
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
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                    placeholder="Konfirmasi kata sandi"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white/80 transition-colors duration-300"
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
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-100 bg-white/5 border-white/20 rounded focus:ring-primary-100 focus:ring-2 mt-1"
                required
              />
              <label className="ml-2 text-sm text-white/70">
                Saya menyetujui{" "}
                <Link
                  href="/terms"
                  className="text-primary-100 hover:text-primary-200 underline transition-colors duration-300"
                >
                  Syarat dan Ketentuan
                </Link>{" "}
                serta{" "}
                <Link
                  href="/privacy"
                  className="text-primary-100 hover:text-primary-200 underline transition-colors duration-300"
                >
                  Kebijakan Privasi
                </Link>
              </label>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-100/80 hover:to-primary-200/80 hover:scale-[1.02] active:scale-95 shadow-primary-100/25"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mendaftar...
                </div>
              ) : (
                "Daftar"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-[#22102A] via-[#22102A] to-[#3D1A78] text-white/70">
                  atau daftar dengan
                </span>
              </div>
            </div>

            {/* Google register */}
            <GoogleAuthButton mode="register" onError={handleGoogleError} />
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-white/70 mt-8">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-primary-100 hover:text-primary-200 font-semibold transition-colors duration-300"
            >
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-full lg:w-[60%] h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-primary-200/30"></div>
        <div className="relative w-full h-full">
          <img
            src={"/bg-auth.png"}
            alt="RobuxID"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#22102A]/50 to-transparent"></div>

          {/* Decorative elements */}

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-primary-100/20 rounded-full backdrop-blur-sm border border-primary-100/30"></div>
          <div className="absolute bottom-32 right-32 w-12 h-12 bg-primary-200/20 rounded-full backdrop-blur-sm border border-primary-200/30"></div>
          <div className="absolute top-1/2 left-10 w-8 h-8 bg-primary-100/30 rounded-full backdrop-blur-sm"></div>
          <div className="absolute top-1/4 right-20 w-6 h-6 bg-primary-200/40 rounded-full backdrop-blur-sm"></div>
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-primary-100/50 rounded-full backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  );
}
