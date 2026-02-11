"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Zap, Shield, HeartHandshake, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SiteSettings {
  whatsappNumber?: string;
  instagramUrl?: string;
  discordInvite?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "privacy" | "terms";
}

const PrivacyContent = () => (
  <div className="space-y-6 text-white/80">
    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">1. Pendahuluan</h3>
      <p className="leading-relaxed">
        Selamat datang di RBXNET. Kami menghargai privasi Anda dan berkomitmen
        untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan
        bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi
        informasi Anda saat menggunakan layanan kami.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        2. Informasi yang Kami Kumpulkan
      </h3>
      <p className="leading-relaxed mb-3">
        Kami mengumpulkan informasi berikut:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>
          <span className="text-neon-purple font-medium">Data Identitas:</span>{" "}
          Nama, alamat email, nomor telepon
        </li>
        <li>
          <span className="text-neon-purple font-medium">Data Akun Rbx:</span>{" "}
          Username Rbx, User ID (untuk keperluan transaksi)
        </li>
        <li>
          <span className="text-neon-purple font-medium">Data Transaksi:</span>{" "}
          Riwayat pembelian, metode pembayaran yang digunakan
        </li>
        <li>
          <span className="text-neon-purple font-medium">Data Teknis:</span>{" "}
          Alamat IP, jenis browser, informasi perangkat
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        3. Penggunaan Informasi
      </h3>
      <p className="leading-relaxed mb-3">Informasi Anda digunakan untuk:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Memproses dan menyelesaikan transaksi</li>
        <li>Mengirimkan notifikasi terkait pesanan dan layanan</li>
        <li>Memberikan dukungan pelanggan</li>
        <li>Meningkatkan layanan dan pengalaman pengguna</li>
        <li>Mencegah penipuan dan aktivitas ilegal</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        4. Keamanan Data
      </h3>
      <p className="leading-relaxed">
        Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang
        sesuai untuk melindungi data pribadi Anda dari akses tidak sah,
        pengungkapan, perubahan, atau penghancuran. Data sensitif dienkripsi dan
        disimpan dengan aman di server yang terlindungi.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        5. Berbagi Informasi
      </h3>
      <p className="leading-relaxed">
        Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak
        ketiga. Informasi hanya dibagikan dengan:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
        <li>Penyedia layanan pembayaran untuk memproses transaksi</li>
        <li>Pihak berwenang jika diwajibkan oleh hukum</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">6. Hak Pengguna</h3>
      <p className="leading-relaxed mb-3">Anda memiliki hak untuk:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Mengakses data pribadi yang kami simpan</li>
        <li>Meminta koreksi data yang tidak akurat</li>
        <li>Meminta penghapusan data Anda</li>
        <li>Menarik persetujuan penggunaan data</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">7. Cookie</h3>
      <p className="leading-relaxed">
        Website kami menggunakan cookie untuk meningkatkan pengalaman browsing
        Anda. Cookie membantu kami mengingat preferensi Anda dan menyediakan
        layanan yang lebih personal.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        8. Perubahan Kebijakan
      </h3>
      <p className="leading-relaxed">
        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.
        Perubahan akan diumumkan melalui website kami dan berlaku sejak tanggal
        publikasi.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">9. Kontak</h3>
      <p className="leading-relaxed">
        Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan
        hubungi kami melalui:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
        <li>Email: support@rbxnet.com</li>
        <li>WhatsApp: Tersedia di halaman kontak</li>
      </ul>
    </section>

    <div className="pt-4 border-t border-neon-purple/20">
      <p className="text-sm text-white/50 italic">
        Terakhir diperbarui: Januari 2026
      </p>
    </div>
  </div>
);

const TermsContent = () => (
  <div className="space-y-6 text-white/80">
    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        1. Ketentuan Umum
      </h3>
      <p className="leading-relaxed">
        Dengan menggunakan layanan RBXNET, Anda menyetujui untuk terikat dengan
        Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini,
        mohon untuk tidak menggunakan layanan kami. RBXNET adalah platform
        independen dan tidak berafiliasi dengan Roblox Corporation.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        2. Layanan yang Disediakan
      </h3>
      <p className="leading-relaxed mb-3">
        RBXNET menyediakan layanan berikut:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>
          <span className="text-neon-purple font-medium">RBX 5 Hari:</span>{" "}
          Pembelian Robux dengan pengiriman dalam 5 hari kerja
        </li>
        <li>
          <span className="text-neon-purple font-medium">RBX Instant:</span>{" "}
          Pembelian Robux dengan pengiriman instan via Gamepass
        </li>
        <li>
          <span className="text-neon-purple font-medium">Gamepass:</span> Jasa
          pembelian Gamepass Roblox
        </li>
        <li>
          <span className="text-neon-purple font-medium">Reseller:</span>{" "}
          Program kemitraan untuk reseller
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        3. Persyaratan Pengguna
      </h3>
      <p className="leading-relaxed mb-3">
        Untuk menggunakan layanan kami, Anda harus:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Berusia minimal 13 tahun atau memiliki izin dari orang tua/wali</li>
        <li>Memiliki akun Roblox yang aktif dan valid</li>
        <li>Memberikan informasi yang akurat dan lengkap saat registrasi</li>
        <li>Menjaga kerahasiaan akun dan password Anda</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        4. Proses Transaksi
      </h3>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Semua transaksi harus dilakukan melalui platform RBXNET</li>
        <li>Pembayaran harus diselesaikan sebelum layanan diproses</li>
        <li>
          Pastikan User ID dan informasi Roblox yang diberikan sudah benar
        </li>
        <li>
          Kami tidak bertanggung jawab atas kesalahan informasi yang diberikan
          pengguna
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        5. Kebijakan Pembatalan & Refund
      </h3>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Pembatalan dapat dilakukan sebelum pesanan diproses</li>
        <li>Refund akan diproses dalam 1-3 hari kerja setelah persetujuan</li>
        <li>Biaya administrasi mungkin dikenakan untuk pembatalan tertentu</li>
        <li>Pesanan yang sudah diproses tidak dapat dibatalkan</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">6. Larangan</h3>
      <p className="leading-relaxed mb-3">Pengguna dilarang untuk:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Melakukan penipuan atau memberikan informasi palsu</li>
        <li>Menggunakan layanan untuk aktivitas ilegal</li>
        <li>Menyalahgunakan sistem atau mencoba meretas platform</li>
        <li>
          Melakukan chargeback atau sengketa pembayaran tanpa alasan yang sah
        </li>
        <li>Menjual kembali layanan tanpa izin reseller</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        7. Batasan Tanggung Jawab
      </h3>
      <p className="leading-relaxed">
        RBXNET tidak bertanggung jawab atas kerugian yang timbul akibat:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
        <li>Pelanggaran Terms of Service Roblox oleh pengguna</li>
        <li>Pembekuan atau ban akun Roblox pengguna</li>
        <li>Kesalahan informasi yang diberikan oleh pengguna</li>
        <li>Force majeure atau keadaan di luar kendali kami</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        8. Hak Kekayaan Intelektual
      </h3>
      <p className="leading-relaxed">
        Seluruh konten di platform RBXNET, termasuk logo, desain, dan teks,
        adalah milik RBXNET dan dilindungi oleh hukum hak cipta. Roblox dan
        Robux adalah merek dagang milik Roblox Corporation.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        9. Penyelesaian Sengketa
      </h3>
      <p className="leading-relaxed">
        Setiap sengketa yang timbul akan diselesaikan secara musyawarah. Jika
        tidak tercapai kesepakatan, sengketa akan diselesaikan sesuai dengan
        hukum yang berlaku di Indonesia.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">
        10. Perubahan Ketentuan
      </h3>
      <p className="leading-relaxed">
        RBXNET berhak mengubah Syarat dan Ketentuan ini kapan saja. Pengguna
        akan diberitahu tentang perubahan signifikan melalui email atau
        notifikasi di platform.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-neon-pink mb-3">11. Kontak</h3>
      <p className="leading-relaxed">
        Untuk pertanyaan atau keluhan, silakan hubungi kami melalui:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
        <li>Email: support@rbxnet.com</li>
        <li>WhatsApp: Tersedia di halaman kontak</li>
        <li>Live Chat: Tersedia di platform</li>
      </ul>
    </section>

    <div className="pt-4 border-t border-neon-purple/20">
      <p className="text-sm text-white/50 italic">
        Terakhir diperbarui: Januari 2026
      </p>
    </div>
  </div>
);

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl border border-neon-purple/30 shadow-2xl shadow-neon-purple/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neon-purple/20 bg-primary-900/80 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {type === "privacy" ? <PrivacyContent /> : <TermsContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neon-purple/20 bg-primary-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-neon-pink/30 transition-all duration-300 hover:scale-105"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicAppFooter: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Modal states
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Smooth scroll with top offset to avoid navbar overlap
  const scrollToSection = (id: string) => {
    const OFFSET = 90; // px - adjust to match navbar height
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleAnchorClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    const targetId = hash.replace("#", "");
    console.log("🖱️ Footer link clicked:", targetId, "Current path:", pathname);

    if (pathname === "/") {
      // same page - just scroll
      console.log("📍 Same page scroll");
      scrollToSection(targetId);
    } else {
      // Cross-page: hard navigate with hash (no router, no splash screen)
      console.log("🔄 Cross-page hard navigation with hash");
      window.location.href = `/${hash}`;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (response.ok) {
        setSettings({
          whatsappNumber: data.settings.whatsappNumber,
          instagramUrl: data.settings.instagramUrl,
          discordInvite: data.settings.discordInvite,
          facebookUrl: data.settings.facebookUrl,
          twitterUrl: data.settings.twitterUrl,
          youtubeUrl: data.settings.youtubeUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative bg-[#391C46] text-white overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-secondary/90 to-bg-primary/95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(179,84,195,0.1),transparent_50%)]"></div>

      {/* Neon Border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-pink/50 to-transparent"></div>

      <div className="relative px-6 md:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-6 md:col-span-3">
              <div className="flex flex-col items-start gap-3">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="RBXNET Logo"
                    width={60}
                    height={60}
                    className="relative z-10"
                  />
                  <div className="absolute inset-0 bg-neon-pink/20 rounded-full blur-xl"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">RBXNET</h3>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">
                RBXNET merupakan platform independen yang ditujukan bagi
                komunitas pemain RBX yang ingin melakukan jual beli item dengan
                cara yang aman, praktis, dan nyaman. Kami tidak memiliki
                afiliasi atau hubungan resmi dengan Roblox Corporation. Seluruh
                merek dagang dan hak cipta tetap menjadi milik masing-masing
                pemiliknya.
              </p>

              {/* Trust Badges */}
            </div>
            {/* Menu Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-pink" />
                Menu
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rbx5"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    RBX 5 Hari
                  </Link>
                </li>
                <li>
                  <Link
                    href="/robux-instant"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    RBX Instant
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gamepass"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Gamepass
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/joki"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Jasa Joki
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Support Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-neon-purple" />
                Dukungan
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/#support"
                    onClick={(e) => handleAnchorClick(e, "#support")}
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    onClick={(e) => handleAnchorClick(e, "#faq")}
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#contact"
                    onClick={(e) => handleAnchorClick(e, "#contact")}
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Kontak
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://youtu.be/MGG2oGEYF3Y"
                    target="_blank"
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Cara Beli
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Social Section */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Legal & Social
              </h3>
              <ul className="space-y-3 mb-6">
                <li>
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Kebijakan Privasi
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-white/70 hover:text-[#f63ae6] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Syarat & Ketentuan
                  </button>
                </li>
              </ul>

              {/* Social Media */}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neon-purple/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
                <p className="text-white/60 text-sm">
                  © 2025 RBXNET - Platform RBX Terpercaya Indonesia
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div>
                  <p className="text-sm font-semibold text-white/80 mb-3">
                    Ikuti Kami
                  </p>
                  {!loading && (
                    <div className="flex gap-4">
                      {settings.whatsappNumber && (
                        <Link
                          href={`https://wa.me/${settings?.whatsappNumber?.replace(
                            /\D/g,
                            "",
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl flex items-center justify-center border border-green-400/30 group-hover:border-green-400/60 transition-all duration-300 group-hover:scale-110">
                            <Image
                              src="/wa.png"
                              alt="WhatsApp"
                              width={20}
                              height={20}
                              className="group-hover:brightness-110 transition-all duration-300"
                            />
                          </div>
                        </Link>
                      )}
                      {settings.instagramUrl && (
                        <Link
                          href={settings.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-pink-400/30 group-hover:border-pink-400/60 transition-all duration-300 group-hover:scale-110">
                            <Image
                              src="/ig.png"
                              alt="Instagram"
                              width={20}
                              height={20}
                              className="group-hover:brightness-110 transition-all duration-300"
                            />
                          </div>
                        </Link>
                      )}
                      {settings.discordInvite && (
                        <Link
                          href={settings.discordInvite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-xl flex items-center justify-center border border-blue-400/30 group-hover:border-blue-400/60 transition-all duration-300 group-hover:scale-110">
                            <Image
                              src="/discord.png"
                              alt="Discord"
                              width={20}
                              height={20}
                              className="group-hover:brightness-110 transition-all duration-300"
                            />
                          </div>
                        </Link>
                      )}
                      {settings.facebookUrl && (
                        <Link
                          href={settings.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500/60 transition-all duration-300 group-hover:scale-110">
                            <svg
                              className="w-5 h-5 text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </div>
                        </Link>
                      )}
                      {settings.twitterUrl && (
                        <Link
                          href={settings.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-400/20 to-sky-600/20 rounded-xl flex items-center justify-center border border-sky-400/30 group-hover:border-sky-400/60 transition-all duration-300 group-hover:scale-110">
                            <svg
                              className="w-5 h-5 text-sky-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                          </div>
                        </Link>
                      )}
                      {settings.youtubeUrl && (
                        <Link
                          href={settings.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-xl flex items-center justify-center border border-red-500/30 group-hover:border-red-500/60 transition-all duration-300 group-hover:scale-110">
                            <svg
                              className="w-5 h-5 text-red-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                  {loading && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Modals */}
      <DocumentModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Kebijakan Privasi"
        type="privacy"
      />
      <DocumentModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Syarat dan Ketentuan"
        type="terms"
      />
    </footer>
  );
};

export default PublicAppFooter;
