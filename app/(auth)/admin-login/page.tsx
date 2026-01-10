"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLoginPage() {
  const { adminLogin, user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if already logged in as admin
  if (user && isAdmin()) {
    router.push("/admin/dashboard");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await adminLogin(formData.email, formData.password, formData.rememberMe);
      // adminLogin will handle the redirect to /admin/dashboard
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat login admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Handle Google login for admin
    console.log("Google admin login clicked");
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
            <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-100/25">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              ADMIN LOGIN
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Masuk ke panel admin RBXNET
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Email Admin
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="Masukkan email admin"
                required
              />
            </div>

            {/* Password field */}
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
                  placeholder="Masukkan kata sandi"
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

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-100 bg-white/5 border-white/20 rounded focus:ring-primary-100 focus:ring-2"
                />
                <span className="ml-2 text-sm text-white/70">Ingat saya</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-100 hover:text-primary-200 transition-colors duration-300"
              >
                Lupa kata sandi?
              </Link>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg border-2 outline-none focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 focus:ring-offset-[#22102A] ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed border-gray-400"
                  : "bg-gradient-to-r from-primary-100 to-primary-200 border-primary-100/50 hover:border-primary-100 hover:from-primary-100/80 hover:to-primary-200/80 hover:scale-[1.02] active:scale-95 shadow-primary-100/25"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Memproses...
                </div>
              ) : (
                "Masuk ke Admin Panel"
              )}
            </button>

            {/* Divider */}

            {/* Google login */}
          </form>

          {/* Back to regular login */}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-[60%] relative bg-gradient-to-br from-primary-100/20 to-primary-200/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
              <svg
                className="w-16 h-16 text-primary-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4">Admin Panel</h2>
            <p className="text-xl opacity-90 mb-8">
              Kelola platform RBXNET dengan mudah
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"></div>
          <div className="absolute bottom-32 right-32 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"></div>
          <div className="absolute top-1/2 left-10 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full"></div>
          <div className="absolute top-1/4 right-20 w-6 h-6 bg-white/10 backdrop-blur-sm rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-white/10 backdrop-blur-sm rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
