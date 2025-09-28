import Link from "next/link";
import Image from "next/image";
import { Sparkles, Zap, Shield, HeartHandshake } from "lucide-react";

const PublicAppFooter: React.FC = () => {
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
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="RobuxID Logo"
                    width={60}
                    height={60}
                    className="relative z-10"
                  />
                  <div className="absolute inset-0 bg-neon-pink/20 rounded-full blur-xl"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">RobuxID</h3>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">
                Platform terpercaya untuk transaksi Robux dengan{" "}
                <span className="text-neon-pink font-semibold">
                  harga terbaik
                </span>
                ,{" "}
                <span className="text-neon-purple font-semibold">
                  proses instan
                </span>
                , dan{" "}
                <span className="text-white font-semibold">
                  keamanan terjamin
                </span>
                .
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
                    className="text-white/70 hover:text-neon-pink transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rbx5"
                    className="text-white/70 hover:text-neon-pink transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Robux 5 Hari
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-neon-pink transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Robux Instant
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gamepass"
                    className="text-white/70 hover:text-neon-pink transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Gamepass
                  </Link>
                </li>
                <li>
                  <Link
                    href="/joki"
                    className="text-white/70 hover:text-neon-pink transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Jasa Joki
                  </Link>
                </li>
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
                    href="#"
                    className="text-white/70 hover:text-neon-purple transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-neon-purple transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Kontak
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-neon-purple transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neon-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Cara Beli
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Social Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Legal & Social
              </h3>
              <ul className="space-y-3 mb-6">
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-white/70 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    Affiliate
                  </Link>
                </li>
              </ul>

              {/* Social Media */}
              <div>
                <p className="text-sm font-semibold text-white/80 mb-3">
                  Ikuti Kami
                </p>
                <div className="flex gap-4">
                  <Link href="#" className="group relative">
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
                  <Link href="#" className="group relative">
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
                  <Link href="#" className="group relative">
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
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neon-purple/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
                <p className="text-white/60 text-sm">
                  © 2025 RobuxID - Platform Robux Terpercaya Indonesia
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  SSL Secured
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  99.9% Uptime
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicAppFooter;
