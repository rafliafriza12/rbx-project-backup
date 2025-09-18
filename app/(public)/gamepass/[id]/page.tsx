"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReviewSection from "@/components/ReviewSection";

interface GamepassItem {
  itemName: string;
  imgUrl: string;
  price: number;
}

interface Gamepass {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  showOnHomepage: boolean;
  developer: string;
  item: GamepassItem[];
}

export default function GamepassDetailPage() {
  const [gamepass, setGamepass] = useState<Gamepass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GamepassItem | null>(null);
  const [username, setUsername] = useState("");

  const params = useParams();
  const router = useRouter();
  const gamepassId = params.id as string;

  // Check if all required fields are filled
  const isFormValid = selectedItem !== null && username.trim() !== "";

  useEffect(() => {
    if (gamepassId) {
      fetchGamepass();
    }
  }, [gamepassId]);

  const fetchGamepass = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gamepass/${gamepassId}`);
      const data = await response.json();

      if (data.success) {
        setGamepass(data.data);
        // Auto select first item if available
        if (data.data.item.length > 0) {
          setSelectedItem(data.data.item[0]);
        }
      } else {
        setError(data.error || "Gamepass tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching gamepass:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!isFormValid || !selectedItem || !gamepass) return;

    // Redirect to new checkout system
    const checkoutData = {
      serviceType: "gamepass",
      serviceId: gamepass._id,
      serviceName: `${gamepass.gameName} - ${selectedItem.itemName}`,
      serviceImage: gamepass.imgUrl,
      quantity: 1,
      unitPrice: selectedItem.price,
      totalAmount: selectedItem.price,
      robloxUsername: username,
      robloxPassword: null, // Gamepass tidak memerlukan password
      gamepassData: {
        gameName: gamepass.gameName,
        itemName: selectedItem.itemName,
        imgUrl: selectedItem.imgUrl,
      },
    };

    // Store in sessionStorage for checkout page
    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Memuat gamepass...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mr-2"
        >
          Kembali
        </button>
        <button
          onClick={fetchGamepass}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!gamepass) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gamepass tidak ditemukan</p>
        <button
          onClick={() => router.push("/gamepass")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          Kembali ke Daftar Gamepass
        </button>
      </div>
    );
  }

  return (
    <main className="">
      <div className="max-w-6xl mx-auto ">
        <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] relative rounded-lg overflow-hidden">
          <Image
            src={gamepass.imgUrl}
            alt="banner"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <section className="max-w-6xl mx-auto bg-[#c86f6f] rounded-lg  sm:p-4 mt-4 sm:mt-6 z-10 relative flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-lg">
        <div className="flex-shrink-0 self-center sm:self-start ">
          <Image
            src={gamepass.imgUrl}
            alt={gamepass.gameName}
            width={120}
            height={120}
            className=" sm:h-[150px] rounded-md object-cover mx-auto sm:mx-0"
          />
        </div>

        <div className="flex flex-col justify-between w-full text-center sm:text-left mx-4">
          <div className="mt-2 sm:mt-5">
            <h1 className="text-lg sm:text-xl font-bold text-black leading-tight">
              {gamepass.gameName}
            </h1>
            <p className="text-sm text-black/80">
              {gamepass.developer} <span className="text-blue-600">✔️</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 sm:gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-black/80 mt-3 sm:mt-4">
            {gamepass.features.map((feature, index) => (
              <span key={index} className="flex items-center gap-1">
                <span className="text-blue-500">✅</span> {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 ">
        <div className="bg-[#e28686] rounded-xl p-4 w-full h-auto lg:h-[260px] flex flex-col justify-start mx-auto lg:mx-0">
          <h2 className="text-black font-extrabold text-base sm:text-lg mb-2 text-center lg:text-left">
            Cara pesan :
          </h2>
          <ol className="list-decimal list-inside text-black text-sm font-medium space-y-1 text-center lg:text-left">
            {gamepass.caraPesan.map((cara, index) => (
              <li key={index}>{cara}</li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#e28686] rounded p-3 sm:p-4 space-y-4 w-full mx-auto lg:mx-0">
            <div>
              <label className="text-sm font-bold mb-1 block text-black">
                Username
              </label>
              <div className="flex items-center border border-black rounded overflow-hidden bg-white w-full max-w-[520px] mx-auto lg:mx-0">
                <div className="px-3 py-2 border-r border-black bg-[#d06565] flex items-center justify-center">
                  <Image src="/src.png" alt="search" width={20} height={20} />
                </div>

                <input
                  type="text"
                  placeholder="Masukkan Username Roblox"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="py-2 px-3 outline-none text-sm text-black flex-1 min-w-0"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#e28686] rounded-xl p-4 sm:p-5">
            <h2 className="font-extrabold text-base mb-4 text-black text-center lg:text-left">
              Pilih Item :
            </h2>
            {gamepass.item.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {gamepass.item.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className={`rounded-xl px-3 sm:px-4 py-3 flex flex-col items-center text-center transition-all duration-300 ${
                      selectedItem?.itemName === item.itemName
                        ? "bg-[#FF9C01] scale-[1.01] shadow-lg"
                        : "bg-[#d76262] hover:scale-[1.01]"
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-full w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] flex items-center justify-center">
                      <Image
                        src={item.imgUrl}
                        alt={item.itemName}
                        fill
                        className="w-full h-full object-cover "
                      />
                    </div>

                    <div className="mt-2 text-[11px] sm:text-[13px] font-semibold text-white leading-tight">
                      {item.itemName}
                    </div>
                    <div className="text-[12px] sm:text-[14px] text-black font-extrabold mt-[2px]">
                      Rp. {item.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">
                  Belum ada item tersedia untuk gamepass ini
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-4">
            <button
              onClick={handlePurchase}
              disabled={!isFormValid}
              className={`font-bold py-3 px-6 rounded-xl w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[750px] mx-auto flex items-center justify-center gap-2 transition-all duration-300 ease-in-out transform shadow-md ${
                isFormValid
                  ? "bg-[#CE3535] text-white hover:scale-105 active:scale-95 hover:shadow-lg cursor-pointer"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
              }`}
            >
              Beli Sekarang -{" "}
              {selectedItem
                ? `Rp. ${selectedItem.price.toLocaleString()}`
                : "Pilih item dulu"}
              <Image
                src="/beli.png"
                alt="cart"
                width={18}
                height={18}
                className="sm:w-5 sm:h-5"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Review Section */}
      {gamepass && (
        <ReviewSection
          serviceType="gamepass"
          serviceId={gamepass._id}
          serviceName={gamepass.gameName}
          title={`Reviews ${gamepass.gameName}`}
        />
      )}
    </main>
  );
}
