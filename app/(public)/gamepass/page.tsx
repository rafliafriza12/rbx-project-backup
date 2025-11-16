"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ReviewSection from "@/components/ReviewSection";

interface Gamepass {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  showOnHomepage: boolean;
  developer: string;
  item: {
    itemName: string;
    imgUrl: string;
    price: number;
  }[];
}

export default function GamepassPage() {
  const [gamepasses, setGamepasses] = useState<Gamepass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchGamepasses();
  }, []);

  const fetchGamepasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gamepass");
      const data = await response.json();

      if (data.success) {
        setGamepasses(data.data);
      } else {
        setError(data.error || "Gagal mengambil data gamepass");
      }
    } catch (error) {
      console.error("Error fetching gamepasses:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  // Filter gamepasses based on search query
  const filteredGamepasses = gamepasses.filter((gamepass) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      gamepass.gameName.toLowerCase().includes(searchLower) ||
      gamepass.developer.toLowerCase().includes(searchLower) ||
      gamepass.item.some((item) =>
        item.itemName.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-100/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary-200/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-3/4 left-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 pt-20 pb-16">
        <div className="text-center px-4 mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white">
            <span className="bg-gradient-to-r from-primary-100 via-primary-200 to-purple-400 bg-clip-text text-transparent">
              Gamepass
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Sudah lama mengidamkan Game Pass itu? Atau ingin punya avatar paling
            kece di antara teman-temanmu?{" "}
            <span className="text-primary-100 font-semibold">RBXNET</span> hadir
            untuk mewujudkan semua impian RBX-mu!
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari game, item, atau developer..."
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
                  {filteredGamepasses.length}
                </span>{" "}
                hasil untuk &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-100/30 border-t-primary-100"></div>
            <span className="ml-3 text-white/70">Memuat gamepass...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
              {error}
            </div>
            <button
              onClick={fetchGamepasses}
              className="bg-gradient-to-r from-primary-100 to-primary-200 text-white px-6 py-3 rounded-lg hover:from-primary-100/80 hover:to-primary-200/80 transition-all duration-300 shadow-lg shadow-primary-100/25"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {filteredGamepasses?.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-primary-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {searchQuery ? (
                    <>
                      <p className="text-white/70 mb-4 text-lg font-semibold">
                        Tidak ada hasil untuk &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-white/50 text-sm mb-6">
                        Coba gunakan kata kunci lain atau hapus filter pencarian
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="bg-gradient-to-r from-primary-100 to-primary-200 text-white px-6 py-3 rounded-lg hover:from-primary-100/80 hover:to-primary-200/80 transition-all duration-300 shadow-lg shadow-primary-100/25"
                      >
                        Hapus Pencarian
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-white/70 mb-4">
                        Belum ada gamepass tersedia
                      </p>
                      <p className="text-white/50 text-sm">
                        Gamepass sedang dalam persiapan
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              filteredGamepasses?.map((gamepass) => {
                const slug = gamepass.gameName.toLowerCase().replace(/ /g, "-");
                return (
                  <Link
                    key={gamepass._id}
                    href={`/gamepass/${gamepass._id}`}
                    className="group focus:outline-none h-full w-full block"
                  >
                    {/* Mobile-Optimized Purple Neon Themed Gamepass Card */}
                    <div className="w-full relative h-full bg-gradient-to-br from-primary-600/80 via-primary-500/60 to-primary-700/80 backdrop-blur-xl border border-primary-200/20 rounded-lg sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-100/30 hover:border-primary-100 flex flex-col">
                      {/* Price Badge - Top Right Corner */}
                      {gamepass.item && gamepass.item.length > 0 && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                          <div className="bg-gradient-to-r from-primary-100/50 to-primary-200/50 backdrop-blur-[3px] text-white/80 px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(246,58,230,0.5)] border border-primary-100/40">
                            <span className="hidden sm:inline">
                              Mulai dari{" "}
                            </span>
                            Rp{" "}
                            {Math.min(
                              ...gamepass.item.map((item) => item.price)
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Game Image - Adjusted aspect ratio for mobile */}
                      <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden flex-shrink-0">
                        <Image
                          src={gamepass.imgUrl}
                          alt={gamepass.gameName}
                          fill
                          className="object-contain transition-all duration-500 group-hover:scale-110"
                        />

                        {/* Purple gradient overlay for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 via-primary-700/30 to-transparent"></div>
                      </div>

                      {/* Card Content - Optimized for mobile */}
                      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 flex-grow flex flex-col">
                        {/* Game Title */}
                        <h3 className="text-primary-50 font-bold text-sm sm:text-lg leading-tight line-clamp-2 group-hover:text-primary-100 transition-colors duration-300">
                          {gamepass.gameName}
                        </h3>

                        {/* Game Items/Description - Hidden on mobile for space */}
                        <div className="space-y-1 sm:space-y-2 flex-grow">
                          {gamepass.item && gamepass.item.length > 0 && (
                            <p className=" text-white/80 text-sm leading-relaxed line-clamp-1">
                              {gamepass.item
                                .slice(0, 3)
                                .map((item) => item.itemName)
                                .join(", ")}
                              {gamepass.item.length > 3 && "..."}
                            </p>
                          )}
                        </div>

                        {/* Bottom section - Compact for mobile */}
                        <div className="space-y-2 sm:space-y-3 mt-auto w-full">
                          {/* Rating - More compact on mobile */}
                          <div className="flex items-center justify-between">
                            <span className="text-white/70 text-[10px] sm:text-xs">
                              {gamepass.item?.length || 0} items
                            </span>
                          </div>

                          {/* Action Button - Now serves as visual indicator */}
                          <div className="w-full bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(244,197,231,0.3)] border border-primary-100/30 transform  text-xs sm:text-sm text-center hover:-translate-y-1">
                            <span className="hidden sm:inline">
                              Lihat Game Pass
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

        {/* Review Section */}
      </div>
    </div>
  );
}
