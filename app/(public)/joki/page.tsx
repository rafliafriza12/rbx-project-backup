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
  syaratJoki: string[];
  prosesJoki: string[];
}

interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  developer: string;
  caraPesan: string[];
  item: JokiItem[];
  createdAt?: string;
  orderCount?: number; // Number of orders for this joki
  isHot?: boolean; // Top 3 most ordered joki
}

export default function JokiPage() {
  const [jokiServices, setJokiServices] = useState<Joki[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        console.log("=== JOKI SERVICES FROM API ===");
        console.log("Total joki:", data.jokiServices.length);
        data.jokiServices.forEach((joki: any) => {
          console.log(`${joki.gameName}:`, {
            orderCount: joki.orderCount,
            isHot: joki.isHot,
          });
        });

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

  // Filter joki services based on search query
  const filteredJokiServices = jokiServices.filter((joki) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      joki.gameName.toLowerCase().includes(searchLower) ||
      joki.developer.toLowerCase().includes(searchLower) ||
      joki.item.some(
        (item) =>
          item.itemName.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="min-h-screen ">
      <div className="text-center px-4 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
          Jasa Joki
        </h1>
        <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
          Kalian ingin cepat naik level cepat, mendapatkan item limited, dan
          menyelesaikan quest dengan cepat? Solusinya dengan joki di website{" "}
          <span className="text-primary-100 font-semibold">RBXNET</span> tinggal
          bayar dan duduk manis semua selesai dengan cepat.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari game, layanan, atau item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-12 sm:pl-14 pr-12 bg-primary-800/40 backdrop-blur-xl border-2 border-primary-100/40 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 text-sm sm:text-base"
              />
              <svg
                className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-primary-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-100/20 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/70">
              Ditemukan{" "}
              <span className="font-bold text-primary-100">
                {filteredJokiServices.length}
              </span>{" "}
              hasil untuk &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
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
          {filteredJokiServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                {searchQuery ? (
                  <>
                    <svg
                      className="w-16 h-16 sm:w-20 sm:h-20 text-primary-200/50 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-white/70 mb-2">
                      Tidak ada hasil untuk &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-white/50 text-sm mb-4">
                      Coba gunakan kata kunci lain
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-6 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-white rounded-lg hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300 font-semibold text-sm"
                    >
                      Tampilkan Semua
                    </button>
                  </>
                ) : (
                  <p className="text-white/70">Belum ada jasa joki tersedia</p>
                )}
              </div>
            </div>
          ) : (
            filteredJokiServices.map((joki) => {
              const minPrice =
                joki.item.length > 0
                  ? Math.min(...joki.item.map((item) => item.price))
                  : 0;

              // Check if joki is less than 7 days old
              const isNew = joki.createdAt
                ? new Date().getTime() - new Date(joki.createdAt).getTime() <
                  7 * 24 * 60 * 60 * 1000
                : false;

              return (
                <Link
                  key={joki._id}
                  href={`/joki/${joki._id}`}
                  className="group focus:outline-none h-full w-full block"
                >
                  {/* Mobile-Optimized Purple Neon Themed Joki Card */}
                  <div className="w-full relative h-full bg-gradient-to-br from-primary-600/80 via-primary-500/60 to-primary-700/80 backdrop-blur-xl border border-primary-200/20 rounded-lg sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-100/30 hover:border-primary-100 flex flex-col min-h-[220px] sm:min-h-[240px]">
                    {/* Badges Container - Top Corners */}
                    <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex justify-between items-start">
                      {/* NEW Badge - Top Left */}
                      {isNew && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-green-400/40 animate-pulse">
                          NEW
                        </div>
                      )}

                      {/* HOT Badge - Top Right - Based on Order Count */}
                      {joki.isHot && (
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.6)] border border-red-400/40 flex items-center gap-1 animate-pulse">
                          <svg
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                              clipRule="evenodd"
                            />
                          </svg>
                          HOT
                        </div>
                      )}
                    </div>

                    {/* Game Image - Adjusted aspect ratio for mobile */}
                    <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden flex-shrink-0">
                      <Image
                        src={joki.imgUrl}
                        alt={joki.gameName}
                        fill
                        className="object-fill transition-all duration-500 group-hover:scale-110"
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
                        </div>

                        {/* Action Button - Now serves as visual indicator */}
                        <div className="w-full bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(244,197,231,0.3)] border border-primary-100/30  transform hover:-translate-y-1 group-active:translate-y-0 text-xs sm:text-sm text-center">
                          <span className="hidden sm:inline">Lihat Joki</span>
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
