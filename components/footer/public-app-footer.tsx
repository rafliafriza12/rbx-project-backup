"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Zap, Shield, HeartHandshake } from "lucide-react";
import { useState, useEffect } from "react";

interface SiteSettings {
  whatsappNumber?: string;
  instagramUrl?: string;
  discordInvite?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
}

const PublicAppFooter: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

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
                {!loading && (
                  <div className="flex gap-4">
                    {settings.whatsappNumber && (
                      <Link
                        href={`https://wa.me/${settings.whatsappNumber.replace(
                          /\D/g,
                          ""
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
