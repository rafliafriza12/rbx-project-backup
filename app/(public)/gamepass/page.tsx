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

  return (
    <div className="min-h-screen">
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          Gamepass
        </h1>
        <p className="text-sm sm:text-base text-gray-700 max-w-xl mx-auto leading-relaxed">
          Sudah lama mengidamkan Game Pass itu? Atau ingin punya avatar paling
          kece di antara teman-temanmu?{" "}
          <span className="text-red-500 font-semibold">RobuxID</span> hadir
          untuk mewujudkan semua impian Roblox-mu!
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Memuat gamepass...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchGamepasses}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 max-w-4xl mx-auto">
          {gamepasses?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada gamepass tersedia</p>
            </div>
          ) : (
            gamepasses?.map((gamepass) => {
              const slug = gamepass.gameName.toLowerCase().replace(/ /g, "-");
              return (
                <Link
                  key={gamepass._id}
                  href={`/gamepass/${gamepass._id}`}
                  className="bg-[#AD6A6A] rounded-xl shadow-md overflow-hidden w-40 sm:w-44 h-[220px] sm:h-[240px] flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <div className="h-40 sm:h-45 relative">
                    <Image
                      src={gamepass.imgUrl}
                      alt={gamepass.gameName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 text-center">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-gray-800 mb-1">
                        {gamepass.gameName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {gamepass.item.length} items tersedia
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
  );
}
