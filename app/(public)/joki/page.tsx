"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
    <div className="min-h-screen">
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          Jasa Joki
        </h1>
        <p className="text-sm sm:text-base text-gray-700 max-w-xl mx-auto leading-relaxed">
          Kalian ingin cepat naik level cepat, mendapatkan item limited, dan
          menyelesaikan quest dengan cepat? Solusinya dengan joki di website{" "}
          <span className="text-red-500 font-semibold">RobuxID</span> tinggal
          bayar dan duduk manis semua selesai dengan cepat.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Memuat jasa joki...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchJokiServices}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10 md:mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6">
          {jokiServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada jasa joki tersedia</p>
            </div>
          ) : (
            jokiServices.map((joki) => {
              return (
                <Link
                  key={joki._id}
                  href={`/joki/${joki._id}`}
                  className="bg-[#AD6A6A] rounded-xl shadow-md overflow-hidden w-full h-[220px] sm:h-[240px] flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <div className="h-40 sm:h-45 relative">
                    <Image
                      src={joki.imgUrl}
                      alt={joki.gameName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 text-center">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-gray-800 mb-1">
                        {joki.gameName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {joki.item.length} layanan tersedia
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
