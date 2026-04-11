"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Check,
  ChevronDown,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicSettings, getActiveBanners } from "@/app/lib/actions";

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

const faqData = [
  {
    question: "Berapa lama waktu pengiriman Robux?",
    answer:
      "Pengiriman Robux dibagi menjadi dua metode:\n\n1. Robux via Gamepass (5 Hari)\nRobux akan masuk ke akun kamu dalam waktu sekitar 5 hari. Estimasi ini mengikuti sistem dan kebijakan dari Roblox.\n\n2. Robux via Login (Reguler)\nRobux akan diproses lebih cepat, yaitu sekitar 15-30 menit setelah pembayaran dikonfirmasi.",
  },
  {
    question: "Apa yang harus dilakukan jika Robux belum masuk?",
    answer:
      "Jangan khawatir! Silakan cek status pesanan kamu di halaman Track Order. Jika sudah lewat dari estimasi waktu, hubungi customer service kami via WhatsApp untuk bantuan lebih lanjut.",
  },
  {
    question: "Apakah aman membeli Robux di sini?",
    answer:
      "Tentu! Kami sudah melayani ribuan transaksi dengan aman. Data kamu dijaga kerahasiaannya dan proses pembelian dilakukan sesuai prosedur yang aman.",
  },
  {
    question: "Apa bedanya RBX 5 Hari dan RBX Reguler?",
    answer:
      "RBX 5 Hari menggunakan metode gamepass dengan harga lebih murah, tapi Robux masuk dalam 5 hari. RBX Reguler menggunakan metode login dengan harga sedikit lebih tinggi, tapi Robux masuk lebih cepat (15-30 menit).",
  },
  {
    question: "Bagaimana cara melakukan refund?",
    answer:
      "Refund dapat dilakukan jika pesanan belum diproses dalam 3 hari. Silakan hubungi customer service kami via WhatsApp untuk mengajukan refund.",
  },
];

export default function RBXLandingPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchActiveBanners();
    fetchSettings();
  }, []);

  const fetchActiveBanners = async () => {
    const defaultBanners = [
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
        imageUrl: "/banner2.webp",
        link: "/rbx5",
        alt: "Banner RBX Promo",
        isActive: true,
        order: 2,
      },
    ];
    try {
      const data = await getActiveBanners();
      if (data.success && data.data && data.data.length > 0) {
        setBanners(data.data);
      } else {
        setBanners(defaultBanners);
      }
    } catch (error) {
      setBanners(defaultBanners);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await getPublicSettings();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {}
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = settings?.whatsappNumber || "+628123456789";
    const message = encodeURIComponent(
      "Halo, saya butuh bantuan untuk order RBX",
    );
    window.open(
      `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`,
      "_blank",
    );
  };

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) =>
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1,
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [banners]);

  return (
    <>
      {/* ============ HERO HEADER ============ */}
      <section className="relative pt-6 pb-6 sm:pb-8 md:pb-10 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-100/10 rounded-full blur-[120px]" />
          <div className="absolute top-10 right-0 w-60 h-60 bg-pink-400/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-blue-400/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-row items-center gap-4 sm:gap-6 md:gap-10">
            {/* Text */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 bg-gradient-to-r from-primary-100/15 to-pink-400/10 border border-primary-100/30 rounded-full text-[10px] sm:text-xs text-primary-100 font-bold uppercase tracking-wider mb-3 sm:mb-4">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                  Beli Robux
                </div>

                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2 sm:mb-4">
                  Pilih Tipe RBX yang{" "}
                  <span className="bg-gradient-to-r from-primary-100 via-pink-300 to-primary-200 bg-clip-text text-transparent">
                    Kamu Mau!
                  </span>
                </h1>

                <p className="text-white/50 text-xs sm:text-sm md:text-base max-w-lg">
                  Sesuaikan dengan isi dompetmu, mau yang murah atau yang cepat? Kamu yang pilih!
                </p>
              </motion.div>
            </div>

            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-shrink-0"
            >
              <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52">
                <Image
                  src="/Maskot/mascot-pointing.webp"
                  alt="Mascot"
                  fill
                  className="object-contain drop-shadow-[0_10px_30px_rgba(246,58,230,0.2)]"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ PRODUCT CARDS ============ */}
      <section className="py-6 sm:py-10 lg:py-16 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary-200/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-400/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {/* RBX 5 Hari Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/rbx5" className="block group h-full">
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] overflow-hidden hover:border-primary-100/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary-100/10 h-full flex flex-col">
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-primary-100 via-pink-400 to-primary-200" />

                  <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-yellow-400/15 to-amber-400/10 border border-yellow-400/30 rounded-full text-[10px] sm:text-xs text-yellow-300 font-bold">
                        <Star className="w-3 h-3 fill-yellow-300" />
                        TERMURAH
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-100/10 border border-primary-100/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-100" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-0.5 sm:mb-1">
                      Topup RBX 5 Hari
                    </h2>
                    <p className="text-white/40 text-xs sm:text-sm mb-4 sm:mb-6">Via pembelian Gamepass</p>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4 sm:mb-6" />

                    {/* Features */}
                    <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-3 sm:mb-4">Yang didapatkan:</p>
                    <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                      {[
                        "Harga Robux super murah, paling hemat!",
                        "Pengiriman sekitar 5 hari ya~",
                        "Pas buat kamu yang santai & nggak buru-buru",
                        "Stok selalu ada, bisa beli kapan aja!",
                        "Bisa pakai kode promo biar makin irit!",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-primary-100/20 to-pink-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-100" />
                          </div>
                          <span className="text-xs sm:text-sm text-white/60 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="relative overflow-hidden rounded-xl mt-auto">
                      <div className="flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold text-sm sm:text-base group-hover:from-primary-100/90 group-hover:to-pink-400 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10">Beli Sekarang</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* RBX Reguler Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/robux-instant" className="block group h-full">
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] overflow-hidden hover:border-amber-400/30 transition-all duration-500 hover:shadow-xl hover:shadow-amber-400/10 h-full flex flex-col">
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

                  <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-amber-400/15 to-yellow-400/10 border border-amber-400/30 rounded-full text-[10px] sm:text-xs text-amber-300 font-bold">
                        <Zap className="w-3 h-3 fill-amber-300" />
                        TERCEPAT
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-0.5 sm:mb-1">
                      Topup RBX Reguler
                    </h2>
                    <p className="text-white/40 text-xs sm:text-sm mb-4 sm:mb-6">Via Login (username & password)</p>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4 sm:mb-6" />

                    {/* Features */}
                    <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-3 sm:mb-4">Yang didapatkan:</p>
                    <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                      {[
                        "Top-up Robux jadi super cepat & gampang!",
                        "Cukup pakai username + password aja~",
                        "Nggak perlu ribet bikin Gamepass",
                        "Aman dipakai & bisa beli banyak!",
                        "Robux dikirim cepat, tanpa pending",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                          </div>
                          <span className="text-xs sm:text-sm text-white/60 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="relative overflow-hidden rounded-xl mt-auto">
                      <div className="flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-sm sm:text-base group-hover:from-amber-400 group-hover:to-yellow-400 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10">Beli Sekarang</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ HELP SECTION ============ */}
      <section className="py-6 sm:py-10 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 via-bg-secondary/50 to-emerald-400/5" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl" />

            <div className="relative p-6 sm:p-8 lg:p-12 flex flex-col items-center text-center md:flex-row md:text-left md:items-center gap-5 sm:gap-8">
              {/* Mascot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex-shrink-0"
              >
                <Image
                  src="/Maskot/mascot-sad.webp"
                  alt="Mascot butuh bantuan"
                  width={120}
                  height={120}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain drop-shadow-[0_10px_30px_rgba(34,197,94,0.15)]"
                />
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 bg-green-500/10 border border-green-500/25 rounded-full text-[10px] sm:text-xs text-green-400 font-bold uppercase tracking-wider mb-3 sm:mb-4">
                  Dapatkan Bantuan Kami
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-2 sm:mb-3">
                  Mengalami Kesulitan?
                </h2>

                <p className="text-white/45 text-xs sm:text-sm md:text-base mb-5 sm:mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  Jangan khawatir! Tim CS kami siap bantu kamu kapan saja. Hubungi lewat WhatsApp atau chat langsung di website.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Hubungi via WhatsApp
                  </button>
                  <Link
                    href="/chat"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-100/20 hover:bg-primary-100/30 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 border border-primary-100/40 hover:border-primary-100/60"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Chat di Website
                  </Link>
                  <span className="text-white/30 text-[10px] sm:text-xs">Respon cepat &bull; Tersedia 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ SECTION ============ */}
      <section className="py-6 sm:py-10 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Mobile/Tablet: stacked layout. Desktop: side by side */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10">
            {/* Left - Title + Mascot */}
            <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 bg-primary-100/10 border border-primary-100/25 rounded-full text-[10px] sm:text-xs text-primary-100 font-bold uppercase tracking-wider mb-4 sm:mb-5">
                  FAQ
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-2 sm:mb-3">
                  Pertanyaan yang Sering Ditanyakan
                </h2>
                <p className="text-white/40 text-xs sm:text-sm mb-6 sm:mb-8 max-w-md">
                  Temukan jawaban untuk pertanyaan umum seputar pembelian Robux di sini.
                </p>

                {/* Mascot */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Image
                    src="/Maskot/mascot-thinking.webp"
                    alt="Mascot thinking"
                    width={160}
                    height={160}
                    className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-[0_10px_30px_rgba(246,58,230,0.15)]"
                  />
                </motion.div>
              </div>
            </div>

            {/* Right - Accordion */}
            <div className="flex-1 space-y-2 sm:space-y-2.5">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden transition-all duration-300 ${
                    openFaq === index
                      ? "bg-white/[0.05] border border-primary-100/20"
                      : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex items-center justify-between w-full px-4 py-3 sm:px-5 sm:py-4 text-left"
                  >
                    <span className={`text-xs sm:text-sm font-semibold pr-3 sm:pr-4 transition-colors ${openFaq === index ? "text-primary-100" : "text-white/70"}`}>
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                        openFaq === index ? "rotate-180 text-primary-100" : "text-white/30"
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 sm:px-5 sm:pb-4">
                          <div className="h-px bg-white/[0.06] mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-white/45 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
