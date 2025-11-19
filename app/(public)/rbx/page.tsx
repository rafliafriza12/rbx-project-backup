"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  MessageCircle,
  DollarSign,
  Shield,
  Rocket,
  Timer,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  _id: string;
  imageUrl: string;
  link: string;
  alt: string;
  isActive: boolean;
  order: number;
}

interface Settings {
  whatsappNumber: string;
  siteName: string;
}

export default function RBXLandingPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchActiveBanners();
    fetchSettings();
  }, []);

  const fetchActiveBanners = async () => {
    try {
      const response = await fetch("/api/banners?active=true");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setBanners(data.data);
        } else {
          setBanners([
            {
              _id: "1",
              imageUrl: "/banner.webp",
              link: "/gamepass",
              alt: "Banner Gamepass Terbaru",
              isActive: true,
              order: 1,
            },
            {
              _id: "2",
              imageUrl: "/banner2.png",
              link: "/rbx5",
              alt: "Banner RBX Promo",
              isActive: true,
              order: 2,
            },
            {
              _id: "3",
              imageUrl: "/banner.png",
              link: "/joki",
              alt: "Banner Joki Service",
              isActive: true,
              order: 3,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBanners([
        {
          _id: "1",
          imageUrl: "/banner.webp",
          link: "/gamepass",
          alt: "Banner Gamepass Terbaru",
          isActive: true,
          order: 1,
        },
        {
          _id: "2",
          imageUrl: "/banner2.png",
          link: "/rbx5",
          alt: "Banner RBX Promo",
          isActive: true,
          order: 2,
        },
        {
          _id: "3",
          imageUrl: "/banner.png",
          link: "/joki",
          alt: "Banner Joki Service",
          isActive: true,
          order: 3,
        },
      ]);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = settings?.whatsappNumber || "+628123456789";
    const message = encodeURIComponent(
      "Halo, saya butuh bantuan untuk order RBX"
    );
    window.open(
      `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`,
      "_blank"
    );
  };

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) =>
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [banners]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden ">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 border border-neon-pink/30 rounded-2xl text-sm text-neon-pink font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            RBX Premium Experience
          </div>
        </div>
      </section>

      {/* Banner Carousel Section */}
      <section className="relative w-full full aspect-[16/4] lg:aspect-auto lg:h-60 overflow-hidden">
        {loadingBanners ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-pink"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
            <p className="text-white/60">Tidak ada banner tersedia</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {banners.map((banner, index) => {
                let position = index - currentBannerIndex;
                if (position < -1) position = banners.length + position;
                if (position > 1) position = position - banners.length;

                const getCardStyle = (pos: number) => {
                  switch (pos) {
                    case 0:
                      return {
                        transform: "translateX(0%) translateY(0%) scale(1)",
                        zIndex: 30,
                        opacity: 1,
                        filter: "brightness(1)",
                      };
                    case -1:
                      return {
                        transform: "translateX(-20%) translateY(0%) scale(0.8)",
                        zIndex: 10,
                        opacity: 0.7,
                        filter: "brightness(0.6)",
                      };
                    case 1:
                      return {
                        transform: "translateX(5.5%) translateY(0%) scale(0.8)",
                        zIndex: 10,
                        opacity: 0.7,
                        filter: "brightness(0.6)",
                      };
                    default:
                      return {
                        transform: "translateX(0%) translateY(0%) scale(0.5)",
                        zIndex: 0,
                        opacity: 0,
                        filter: "brightness(0.3)",
                      };
                  }
                };

                const cardStyle = getCardStyle(position);

                // Position classes based on card position
                const getPositionClasses = (pos: number) => {
                  switch (pos) {
                    case 0:
                      // Active: Full width on mobile, 80% on desktop
                      return "left-0 w-full lg:left-1/2 lg:-ml-[40%] lg:w-[80%]";
                    case -1:
                      // Left: Hidden on mobile, visible on desktop
                      return "left-[10%] w-[70%] opacity-0 lg:opacity-70";
                    case 1:
                      // Right: Hidden on mobile, visible on desktop
                      return "left-[30%] w-[70%] opacity-0 lg:opacity-70";
                    default:
                      return "left-0 w-full lg:left-1/2 lg:-ml-[35%] lg:w-[70%]";
                  }
                };

                return (
                  <div
                    key={banner._id}
                    className={`absolute top-0 bottom-0 transition-all duration-700 ease-out cursor-pointer ${getPositionClasses(
                      position
                    )}`}
                    style={{
                      transform: cardStyle.transform,
                      zIndex: cardStyle.zIndex,
                      filter: cardStyle.filter,
                    }}
                    onClick={() => {
                      if (position === 0) {
                        window.location.href = banner.link;
                      } else {
                        setCurrentBannerIndex(index);
                      }
                    }}
                  >
                    <div
                      className={`relative w-full h-full group ${
                        position === 0 ? "p-0 lg:p-4" : "p-2 sm:p-3 lg:p-4"
                      }`}
                    >
                      <div className="relative w-full h-full overflow-hidden rounded-lg lg:rounded-3xl">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.alt}
                          fill
                          className={`object-fill transition-transform duration-700 ${
                            position === 0
                              ? "group-hover:scale-110"
                              : "group-hover:scale-105"
                          }`}
                          priority={index === 0}
                        />
                        <div
                          className={`absolute inset-0 transition-all duration-500 ${
                            position === 0
                              ? "bg-gradient-to-r from-primary-900/10 via-transparent to-primary-800/10 group-hover:from-primary-900/5 group-hover:to-primary-800/5"
                              : "bg-gradient-to-r from-primary-900/40 via-primary-800/30 to-primary-900/40"
                          }`}
                        ></div>
                        {position === 0 && (
                          <>
                            <div className="absolute inset-0 bg-primary-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl sm:rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Dots - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:flex absolute bottom-4 left-1/2 transform -translate-x-1/2 gap-2 z-40">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentBannerIndex
                      ? "w-8 h-2 bg-gradient-to-r from-neon-pink to-neon-purple"
                      : "w-2 h-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="py-5 lg:py-16 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* RBX 5 Hari Card */}
            <Link href="/rbx5">
              <div className="group relative bg-gradient-to-br from-white/5 via-neon-purple/5 to-neon-pink/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-neon-pink/50 transition-all duration-700 hover:shadow-2xl hover:shadow-neon-pink/30 cursor-pointer overflow-hidden h-full hover:scale-[1.02]">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-neon-purple/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink/30 via-neon-purple/30 to-neon-pink/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-500"></div>

                {/* Floating Particles Effect */}
                <div className="absolute top-1/4 right-10 w-2 h-2 bg-neon-pink rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-300"></div>
                <div className="absolute bottom-1/3 left-10 w-2 h-2 bg-neon-purple rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-300 delay-100"></div>
                <div className="absolute top-1/2 right-20 w-1 h-1 bg-primary-100 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-ping transition-all duration-300 delay-200"></div>

                <div className="relative z-10">
                  {/* Header with Badge and Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/40 rounded-xl text-sm text-neon-pink font-bold backdrop-blur-sm">
                      ⭐ POPULER
                    </div>
                    <div className="p-3 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 rounded-2xl border border-neon-pink/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <Clock className="w-6 h-6 text-neon-pink" />
                    </div>
                  </div>

                  {/* Title with Gradient */}
                  <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-neon-pink mb-4 group-hover:scale-105 transition-transform duration-300">
                    Topup RBX 5 Hari
                  </h2>

                  {/* Description */}
                  <p className="text-white/70 text-base sm:text-lg mb-6 leading-relaxed">
                    Beli RBX 5 Hari, RBX akan dirumuskan ke akunmu melalui{" "}
                    <span className="text-neon-pink font-semibold bg-neon-pink/10  rounded-lg">
                      pembelian gamepass
                    </span>
                    . RBX akan masuk ke akun kamu dalam waktu{" "}
                    <span className="text-neon-pink font-semibold bg-neon-pink/10  rounded-lg">
                      5 hari
                    </span>{" "}
                    setelah selesai diproses!
                  </p>

                  {/* Features with Enhanced Style */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <DollarSign className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">Harga lebih murah</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <Shield className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">Proses cepat dan aman</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <Timer className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">
                        RBX masuk dalam 5 hari
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="relative overflow-hidden rounded-2xl group-hover:shadow-2xl group-hover:shadow-neon-pink/50 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-pink rounded-2xl group-hover:from-neon-pink group-hover:to-neon-purple transition-all duration-500 relative overflow-hidden">
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                      <span className="text-white font-bold text-lg relative z-10">
                        Pilih Paket
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="text-white font-semibold text-sm">
                          Lihat Detail
                        </span>
                        <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* RBX Instant Card */}
            <Link href="/robux-instant">
              <div className="group relative bg-gradient-to-br from-white/5 via-neon-purple/5 to-neon-pink/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-neon-pink/50 transition-all duration-700 hover:shadow-2xl hover:shadow-neon-pink/30 cursor-pointer overflow-hidden h-full hover:scale-[1.02]">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-neon-purple/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink/30 via-neon-purple/30 to-neon-pink/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-500"></div>

                {/* Floating Particles Effect */}
                <div className="absolute top-1/4 right-10 w-2 h-2 bg-neon-pink rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-300"></div>
                <div className="absolute bottom-1/3 left-10 w-2 h-2 bg-neon-purple rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-300 delay-100"></div>
                <div className="absolute top-1/2 right-20 w-1 h-1 bg-primary-100 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-ping transition-all duration-300 delay-200"></div>

                <div className="relative z-10">
                  {/* Header with Badge and Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/40 rounded-xl text-sm text-neon-pink font-bold backdrop-blur-sm">
                      ⚡ TERCEPAT
                    </div>
                    <div className="p-3 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 rounded-2xl border border-neon-pink/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <Zap className="w-6 h-6 text-neon-pink" />
                    </div>
                  </div>

                  {/* Title with Gradient */}
                  <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-neon-pink mb-4 group-hover:scale-105 transition-transform duration-300">
                    Topup RBX Reguler
                  </h2>

                  {/* Description */}
                  <p className="text-white/70 text-base sm:text-lg mb-6 leading-relaxed">
                    Top up RBX termurah dengan harga bersahabat, vilog hanya
                    perlu{" "}
                    <span className="text-neon-pink font-semibold bg-neon-pink/10 rounded-lg">
                      username dan password
                    </span>
                    , proses cepat dan aman hingga RBX masuk ke akun kamu!
                  </p>

                  {/* Features with Enhanced Style */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <Zap className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">
                        Proses instant & otomatis
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <Shield className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">
                        Hanya perlu username & password
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-neon-pink/20 transition-all duration-300">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                        <Rocket className="w-5 h-5 text-neon-pink" />
                      </div>
                      <span className="font-medium">RBX langsung masuk</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="relative overflow-hidden rounded-2xl group-hover:shadow-2xl group-hover:shadow-neon-pink/50 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-pink rounded-2xl group-hover:from-neon-pink group-hover:to-neon-purple transition-all duration-500 relative overflow-hidden">
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                      <span className="text-white font-bold text-lg relative z-10">
                        Pilih Paket
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="text-white font-semibold text-sm">
                          Lihat Detail
                        </span>
                        <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* WhatsApp CTA Section */}
          <div className="max-w-6xl mx-auto">
            <div className="group relative bg-gradient-to-br from-white/5 via-green-500/5 to-neon-pink/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 lg:p-12 hover:border-green-500/30 transition-all duration-700 hover:shadow-2xl hover:shadow-green-500/20 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500"></div>

              {/* Floating Elements */}
              <div className="absolute top-10 right-10 w-20 h-20 bg-green-500/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

              <div className="relative text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-green-500/20 to-green-400/20 rounded-2xl border border-green-500/30 group-hover:scale-110 transition-all duration-300">
                  <MessageCircle className="w-8 h-8 text-green-500" />
                </div>

                {/* Title */}
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  Mengalami Kesulitan Saat Order?
                </h3>

                {/* Description */}
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                  Tim customer service kami siap membantu kamu 24/7!
                  <br className="hidden sm:block" />
                  Chat dengan kami sekarang untuk bantuan cepat dan ramah.
                </p>

                {/* WhatsApp CTA Button */}
                <button
                  onClick={handleWhatsAppClick}
                  className="group/btn relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-400 rounded-2xl font-bold text-white text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  {/* Button Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                    <span>Hubungi via WhatsApp</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>

                {/* Helper Text */}
                <p className="mt-4 text-white/50 text-sm">
                  Respon cepat • Gratis Konsultasi • Tersedia 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
