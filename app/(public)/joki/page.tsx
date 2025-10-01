"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ReviewSection from "@/components/ReviewSection";

interface JokiItem {
  itemName: string;
  imgUrl: string;
  price: number;
  description: string;
}

interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  requirements: string[];
  item: JokiItem[];
}

export default function JokiPage() {
  const [jokiServices, setJokiServices] = useState<Joki[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchJokiServices();
  }, []);

  const fetchJokiServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/joki");
      const data = await response.json();

      if (response.ok) {
        setJokiServices(data.jokiServices);
      } else {
        setError(data.error || "Gagal mengambil data joki services");
      }
    } catch (error) {
      console.error("Error fetching joki services:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="text-center px-4 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
          Jasa Joki
        </h1>
        <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
          Kalian ingin cepat naik level cepat, mendapatkan item limited, dan
          menyelesaikan quest dengan cepat? Solusinya dengan joki di website{" "}
          <span className="text-primary-100 font-semibold">RobuxID</span>{" "}
          tinggal bayar dan duduk manis semua selesai dengan cepat.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100"></div>
          <span className="ml-3 text-white/80">Memuat jasa joki...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4 bg-red-900/20 backdrop-blur-sm border border-red-400/20 rounded-lg p-4 max-w-md mx-auto">
            {error}
          </div>
          <button
            onClick={fetchJokiServices}
            className="bg-gradient-to-r from-primary-100 to-primary-200 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300 font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10 md:mt-12 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6">
          {jokiServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-white/70 mb-4">
                  Belum ada jasa joki tersedia
                </p>
              </div>
            </div>
          ) : (
            jokiServices.map((joki) => {
              const minPrice =
                joki.item.length > 0
                  ? Math.min(...joki.item.map((item) => item.price))
                  : 0;
              return (
                <Link
                  key={joki._id}
                  href={`/joki/${joki._id}`}
                  className="group focus:outline-none h-full w-full block"
                >
                  {/* Mobile-Optimized Purple Neon Themed Joki Card */}
                  <div className="w-full relative h-full bg-gradient-to-br from-primary-600/80 via-primary-500/60 to-primary-700/80 backdrop-blur-xl border border-primary-200/20 rounded-lg sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-100/30 hover:border-primary-100 flex flex-col min-h-[220px] sm:min-h-[240px]">
                    {/* Price Badge - Top Right Corner */}
                    {joki.item && joki.item.length > 0 && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                        <div className="bg-gradient-to-r from-primary-100/50 to-primary-200/50 backdrop-blur-[3px] text-white/80 px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(246,58,230,0.5)] border border-primary-100/40">
                          Hot
                        </div>
                      </div>
                    )}

                    {/* Game Image - Adjusted aspect ratio for mobile */}
                    <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden flex-shrink-0">
                      <Image
                        src={joki.imgUrl}
                        alt={joki.gameName}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-110"
                      />

                      {/* Purple gradient overlay for better contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 via-primary-700/30 to-transparent"></div>
                    </div>

                    {/* Card Content - Optimized for mobile */}
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 flex-grow flex flex-col">
                      {/* Game Title */}
                      <h3 className="text-primary-50 font-bold text-sm sm:text-lg leading-tight line-clamp-2 group-hover:text-primary-100 transition-colors duration-300">
                        {joki.gameName}
                      </h3>

                      {/* Service Count and Rating */}
                      <div className="space-y-1 sm:space-y-2 flex-grow">
                        <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                          {joki.item.length} layanan tersedia
                        </p>
                      </div>

                      {/* Bottom section - Compact for mobile */}
                      <div className="space-y-2 sm:space-y-3 mt-auto w-full">
                        {/* Rating - More compact on mobile */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-[10px] sm:text-xs">
                            Jasa Professional
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-[10px] sm:text-xs">
                              ⭐
                            </span>
                            <span className="text-white/70 text-[10px] sm:text-xs">
                              4.9
                            </span>
                          </div>
                        </div>

                        {/* Action Button - Now serves as visual indicator */}
                        <div className="w-full bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(244,197,231,0.3)] border border-primary-100/30  transform hover:-translate-y-1 group-active:translate-y-0 text-xs sm:text-sm text-center">
                          <span className="hidden sm:inline">
                            Lihat Jasa Joki
                          </span>
                          <span className="sm:hidden">Lihat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
