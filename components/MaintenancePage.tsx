"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Clock, Mail, MessageCircle } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if maintenance mode is still active, if not redirect to home
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();

          if (data.maintenanceMode === false) {
            // Clear the maintenance cookie
            document.cookie = `maintenance_mode=; path=/; max-age=0; SameSite=Lax`;
            // Redirect to home page
            router.replace("/");
          }
        }
      } catch (error) {
        // On error, try to redirect to home anyway
        document.cookie = `maintenance_mode=; path=/; max-age=0; SameSite=Lax`;
      }
    };

    // Check immediately
    checkMaintenanceStatus();

    // Check every 5 seconds for faster response when maintenance is turned off
    const interval = setInterval(checkMaintenanceStatus, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const defaultMessage =
    message || "Situs sedang dalam pemeliharaan. Silakan coba lagi nanti.";

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

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink/30 to-neon-purple/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          {/* Content container */}
          <div className="relative bg-primary-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl text-center">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full blur-xl opacity-75 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full flex items-center justify-center shadow-2xl shadow-neon-pink/50">
                  <Wrench className="w-12 h-12 text-white animate-bounce" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-black text-white mb-4">
              🔧 Mode Pemeliharaan
            </h1>

            {/* Message */}
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              {defaultMessage}
            </p>

            {/* Time */}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm">
                Kami akan segera kembali. Terima kasih atas kesabaran Anda! 🙏
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
