"use client";
import Image from "next/image";
import Link from "next/link";
// 1. Import useRef dari React
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";
import PublicLayout from "./(public)/layout";

interface RBX5Stats {
  totalStok: number;
  totalOrder: number;
  totalTerjual: number;
  hargaPer100Robux: number;
}

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

export default function HomePage() {
  //ini baru ditambahkan
  const [user, setUser] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  // RBX5 Stats state
  const [rbx5Stats, setRbx5Stats] = useState<RBX5Stats>({
    totalStok: 0,
    totalOrder: 0,
    totalTerjual: 0,
    hargaPer100Robux: 13000,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Gamepass state
  const [gamepasses, setGamepasses] = useState<Gamepass[]>([]);
  const [loadingGamepasses, setLoadingGamepasses] = useState(true);

  // Robux input state
  const [robuxAmount, setRobuxAmount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  useEffect(() => {
    // Check if user logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Get user data to check discount
      fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data.data);
          setDiscount(data.data?.discount_percentage || 0);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem("auth_token");
        });
    }

    // Fetch RBX5 statistics
    fetchRbx5Stats();

    // Fetch homepage gamepasses
    fetchHomepageGamepasses();
  }, []);

  // Function to fetch RBX5 statistics
  const fetchRbx5Stats = async () => {
    try {
      const response = await fetch("/api/rbx5-stats");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRbx5Stats(data.data);
        }
      } else {
        console.error("Failed to fetch RBX5 stats");
      }
    } catch (error) {
      console.error("Error fetching RBX5 stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Function to fetch homepage gamepasses
  const fetchHomepageGamepasses = async () => {
    try {
      const response = await fetch("/api/gamepass");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Filter only gamepasses that should be shown on homepage
          const homepageGamepasses = data.data.filter(
            (gamepass: Gamepass) => gamepass.showOnHomepage
          );
          setGamepasses(homepageGamepasses);
        }
      } else {
        console.error("Failed to fetch gamepasses");
      }
    } catch (error) {
      console.error("Error fetching gamepasses:", error);
    } finally {
      setLoadingGamepasses(false);
    }
  };

  // Function to calculate price based on robux amount
  const calculateTotalPrice = (robux: number) => {
    if (robux <= 0 || !rbx5Stats.hargaPer100Robux) return 0;

    // Calculate base price: (robux / 100) * price per 100 robux
    const basePrice = Math.ceil((robux / 100) * rbx5Stats.hargaPer100Robux);

    // Apply discount if user is logged in
    if (discount > 0) {
      const discountAmount = (basePrice * discount) / 100;
      return basePrice - discountAmount;
    }

    return basePrice;
  };

  // Fetch RBX5 stats on component mount
  // useEffect(() => {
  //   fetchRbx5Stats();
  // }, [fetchRbx5Stats]);

  // Handle robux input change
  const handleRobuxChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setRobuxAmount(numValue);
    setTotalPrice(calculateTotalPrice(numValue));
  };

  // Handle redirect to RBX5 page with robux amount
  const handleBuyNow = () => {
    if (robuxAmount <= 0) {
      alert("Silakan masukkan jumlah Robux yang valid");
      return;
    }

    console.log("Preparing data for RBX5:", { robuxAmount, totalPrice });

    // Prepare data for RBX5 page
    const rbx5Data = {
      robuxAmount: robuxAmount,
      totalPrice: totalPrice,
      fromHomePage: true,
    };

    // Store in sessionStorage for RBX5 page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rbx5InputData", JSON.stringify(rbx5Data));
      console.log("Data stored in sessionStorage:", rbx5Data);
    }

    // Redirect to RBX5 page
    router.push("/rbx5");
  };

  // Di bagian harga produk, tampilkan discount jika ada
  const calculatePrice = (basePrice: number) => {
    if (discount > 0) {
      const discountAmount = (basePrice * discount) / 100;
      return {
        original: basePrice,
        final: basePrice - discountAmount,
        saved: discountAmount,
      };
    }
    return { original: basePrice, final: basePrice, saved: 0 };
  };
  // 2. Buat ref untuk menargetkan section pembelian
  const pembelianRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 3. Buat fungsi untuk menangani scroll
  const handleScrollToPembelian = () => {
    pembelianRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center", // Bisa juga 'start' atau 'end'
    });
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-8 sm:py-12 lg:py-16">
        {/* Kiri: Judul & Deskripsi */}
        <div className="w-full lg:w-[55%] space-y-4 sm:space-y-6 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight">
            Wujudkan Impianmu di Roblox <br />
            dengan Robux dari <span className="text-red-600">RobuxID</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            RobuxID hadir untuk mewujudkan semua impian Roblox-mu! Dengan harga
            kompetitif dan proses super cepat, kamu bisa langsung pamer item
            favorit atau menjelajahi dunia baru tanpa hambatan. Jadikan
            pengalaman Roblox-mu lebih epic!
          </p>
          {/* 5. Tambahkan onClick ke tombol ini */}
          <button
            onClick={handleScrollToPembelian}
            className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold shadow text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto max-w-xs mx-auto lg:mx-0"
          >
            DAPATKAN ROBUX HARI INI!
          </button>

          {/* Stats untuk mobile */}
          <div className="grid grid-cols-2 gap-4 mt-6 lg:hidden">
            <div className="bg-[#f6c3ca] px-3 sm:px-4 py-3 rounded-xl text-center shadow-md">
              <div className="text-lg sm:text-xl font-bold text-black">
                {rbx5Stats.totalStok}
              </div>
              <div className="text-xs sm:text-sm text-gray-700">R$ Stok</div>
            </div>
            <div className="bg-[#f6c3ca] px-3 sm:px-4 py-3 rounded-xl text-center shadow-md">
              <div className="text-lg sm:text-xl font-bold text-black">
                {rbx5Stats.totalTerjual}
              </div>
              <div className="text-xs sm:text-sm text-gray-700">R$ Terjual</div>
            </div>
          </div>
        </div>

        {/* Kanan: Gambar & Info */}
        <div className="relative mt-8 lg:mt-0 w-full lg:w-[40%] justify-center hidden lg:flex">
          <Image
            src="/char1.png"
            alt="Roblox Character"
            width={440}
            height={330}
            className="drop-shadow-xl max-w-full h-auto"
          />

          <div className="absolute bottom-[-20px] -right-[-60px] xl:-right-[-100px] bg-[#f6c3ca] px-3 sm:px-4 py-3 rounded-xl rotate-[-17deg] shadow text-xs sm:text-sm text-center font-semibold max-w-[120px] sm:max-w-[140px] w-full">
            {rbx5Stats.totalStok} R$ <br /> Stok Tersedia
          </div>

          <div className="absolute bottom-[-20px] -left-[2px] bg-[#f6c3ca] px-3 sm:px-4 py-3 rounded-xl rotate-[17deg] shadow text-xs sm:text-sm text-center font-semibold max-w-[120px] sm:max-w-[140px] w-full">
            {rbx5Stats.totalTerjual} R$ <br /> Total Terjual
          </div>
        </div>
      </section>

      {/* 4. Lampirkan ref ke section tujuan */}
      <section
        ref={pembelianRef}
        className="px-4 sm:px-6 md:px-12 lg:px-16 py-16 sm:py-24 md:py-32 lg:py-40 flex justify-center"
      >
        <div className="relative w-full max-w-5xl">
          <div className="absolute top-2 left-2 w-full h-full rounded-2xl sm:rounded-3xl bg-[#935656] z-0"></div>

          <div className="relative z-10 bg-[#b76b6b] text-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center lg:text-left">
              Pembelian Robux
            </h2>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <div className="bg-[#e5b7b7] p-4 sm:p-6 rounded-xl flex-1 shadow-md">
                <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-white text-center lg:text-left">
                  Pilih atau masukkan jumlah Robux yang Anda inginkan.
                </p>

                <div className="flex items-center bg-black px-3 sm:px-4 py-2 sm:py-3 rounded-full mb-4">
                  <input
                    type="number"
                    placeholder="0"
                    value={robuxAmount === 0 ? "" : robuxAmount.toString()}
                    onChange={(e) => handleRobuxChange(e.target.value)}
                    min="1"
                    className="bg-transparent text-white w-full outline-none placeholder-white text-base sm:text-lg"
                  />
                  <span className="ml-2 text-white font-bold text-sm sm:text-base">
                    R$
                  </span>
                </div>

                <div className="flex justify-between items-center text-white mb-4">
                  <p className="text-xs sm:text-sm font-semibold">
                    TOTAL HARGA:
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold">
                    {loadingStats ? (
                      <span className="text-sm">Loading...</span>
                    ) : totalPrice > 0 ? (
                      <>
                        Rp. {totalPrice.toLocaleString()}
                        {discount > 0 && (
                          <div className="text-xs text-green-200">
                            Diskon {discount}% diterapkan
                          </div>
                        )}
                      </>
                    ) : (
                      "Rp. 0"
                    )}
                  </p>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={robuxAmount <= 0 || loadingStats}
                  className={`w-full sm:w-auto sm:max-w-[270px] p-2 sm:py-3 rounded-lg font-bold text-white text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-md mx-auto transition-all duration-300 ${
                    robuxAmount <= 0 || loadingStats
                      ? "bg-gray-500 cursor-not-allowed opacity-50"
                      : "bg-[#e23b3b] hover:bg-[#d12a2a] transform hover:scale-105"
                  }`}
                >
                  <Image
                    src="/cart.png"
                    alt="Cart Icon"
                    width={16}
                    height={16}
                    className="sm:w-5 sm:h-5"
                  />
                  <span>BELI SEKARANG</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-white lg:w-80">
                <div className="bg-[#e5b7b7] p-4 sm:p-5 rounded-xl shadow-md text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                    <Image
                      src="/stk.png"
                      alt="stok"
                      width={20}
                      height={20}
                      className="sm:w-6 sm:h-6"
                    />
                    <p className="font-medium text-xs sm:text-sm text-white">
                      TOTAL STOCK
                    </p>
                  </div>
                  <p className="font-extrabold text-lg sm:text-xl text-white">
                    {loadingStats ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      `${rbx5Stats.totalStok.toLocaleString()} R$`
                    )}
                  </p>
                </div>

                <div className="bg-[#e5b7b7] p-4 sm:p-5 rounded-xl shadow-md text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                    <Image
                      src="/tjl.png"
                      alt="terjual"
                      width={20}
                      height={20}
                      className="sm:w-6 sm:h-6"
                    />
                    <p className="font-medium text-sm text-white">
                      PESANAN TERJUAL
                    </p>
                  </div>
                  <p className="font-extrabold text-xl text-white">
                    {loadingStats ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      `${rbx5Stats.totalTerjual.toLocaleString()} R$`
                    )}
                  </p>
                </div>

                <div className="bg-[#e5b7b7] p-5 rounded-xl shadow-md text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                    <Image src="/ord.png" alt="order" width={24} height={24} />
                    <p className="font-medium text-sm text-white">
                      TOTAL ORDER
                    </p>
                  </div>
                  <p className="font-extrabold text-xl text-white">
                    {loadingStats ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      rbx5Stats.totalOrder.toLocaleString()
                    )}
                  </p>
                </div>

                <div className="bg-[#e5b7b7] p-5 rounded-xl shadow-md text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                    <Image
                      src="/rux.png"
                      alt="harga robux"
                      width={24}
                      height={24}
                    />
                    <p className="font-medium text-sm text-white">
                      HARGA ROBUX
                    </p>
                  </div>
                  <p className="font-extrabold text-xl text-white">
                    {loadingStats ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      <>
                        Rp.{rbx5Stats.hargaPer100Robux.toLocaleString()}{" "}
                        <span className="text-sm font-semibold">/ 100R$</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Tersedia */}
      <section className="py-16 text-center text-gray-800">
        <h2 className="text-4xl font-extrabold mb-4">GAME TERSEDIA</h2>
        <p className="text-lg max-w-xl mx-auto mb-12">
          Sudah lama mengidamkan Game Pass itu? Atau ingin punya avatar paling
          kece di antara teman-temanmu?{" "}
          <span className="text-red-500 font-semibold">RobuxID</span> hadir
          untuk mewujudkan semua impian Roblox-mu!
        </p>

        {loadingGamepasses ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600">Memuat game...</span>
          </div>
        ) : gamepasses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Belum ada game tersedia saat ini
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8">
            {gamepasses.map((gamepass, index) => (
              <button
                key={gamepass._id}
                onClick={() => router.push(`/gamepass/${gamepass._id}`)}
                className="relative w-[230px] h-[310px] focus:outline-none active:scale-95 transition duration-300 transform hover:scale-105"
              >
                <div className="absolute top-1.5 left-2 w-full h-full bg-[#a45d5d] rounded-3xl"></div>

                <div className="relative w-full h-full bg-[#c18585] rounded-3xl overflow-hidden z-10">
                  <img
                    src={gamepass.imgUrl}
                    alt={gamepass.gameName}
                    className="w-full h-[230px] object-cover rounded-t-3xl"
                  />
                  <div className="px-4 pt-4 text-white text-xl font-bold">
                    {gamepass.gameName}
                  </div>
                  <div className="px-4 pb-2 text-white/80 text-sm">
                    by {gamepass.developer}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="relative py-20 px-4 md:px-20">
        <div className="absolute top-0 right-0 hidden md:block">
          <Image
            src="/char2.png"
            width={300}
            height={300}
            alt="Character"
            className="object-contain"
          />
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            KENAPA PILIH <span className="text-red-500">RobuxID?</span>
          </h2>
          <p className="text-gray-700 mt-2 max-w-2xl mx-auto">
            Keamanan akun dan data Anda adalah prioritas kami! Dengan proses
            pembelian yang transparan dan anti-ribet. Nikmati game Roblox tanpa
            cemas, karena kami siap melayani Anda 24/7.
          </p>
        </div>

        {/* keunggulan */}
        <div className="bg-[#ad6a6a] rounded-2xl sm:rounded-[30px] shadow-lg backdrop-blur-md p-6 sm:p-8 md:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center text-white">
            <div className="space-y-3 sm:space-y-4 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">
                Proses Instan
              </h3>
              <Image
                src="/rocket.png"
                width={80}
                height={80}
                alt="Proses Instan"
                className="sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
              />
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                Item masuk ke akunmu dalam hitungan detik setelah pembayaran
                berhasil.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">
                Pelayanan Terbaik
              </h3>
              <Image
                src="/jempol.png"
                width={80}
                height={80}
                alt="Pelayanan Terbaik"
                className="sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
              />
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                Tim support kami siap membantu 24/7 jika Anda mengalami kendala.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">
                Aman & Terpercaya
              </h3>
              <Image
                src="/gembok.png"
                width={80}
                height={80}
                alt="Aman & Terpercaya"
                className="sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
              />
              <p className="text-xs sm:text-sm text-white/90 mt-3 sm:mt-6">
                Setiap transaksi dijamin aman dengan enkripsi dan privasi yang
                terjaga.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">
                Pembayaran Lengkap
              </h3>
              <Image
                src="/card.png"
                width={80}
                height={80}
                alt="Pembayaran Lengkap"
                className="sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
              />
              <p className="text-xs sm:text-sm text-white/90 mt-1 sm:mt-2">
                Tersedia berbagai metode pembayaran, dari e-wallet, transfer
                bank, hingga pulsa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="md:w-1/2">
          <Image
            src="/char3.png"
            alt="RobuxID CTA"
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>
        <div className="md:w-1/2 space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-bold">
            <span className="text-red-600">RobuxID</span> : Robux Cepat, Harga
            Bersahabat.
          </h2>
          <p className="text-sm md:text-base">
            Butuh Robux? Langsung ke RobuxID! Layanan tercepat, termudah, dan
            termurah untuk semua kebutuhan Robux-mu. Tingkatkan pengalaman
            bermainmu di Roblox tanpa menunggu lama.
          </p>
          {/* 5. Tambahkan juga onClick ke tombol ini agar fungsinya sama */}
          <button
            onClick={handleScrollToPembelian}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold shadow"
          >
            DAPATKAN ROBUX HARI INI!
          </button>
        </div>
      </section>

      {/* Bantuan Section */}
      <section className="px-4 sm:px-6 md:px-16 py-8 sm:py-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        <div className="w-full lg:w-1/2 space-y-4 text-center lg:text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            Mengalami kesulitan <br />
            <span className="text-red-600">saat membeli Robux?</span>
          </h2>
          <p className="text-sm md:text-base text-gray-700">
            Tim dukungan kami siap membantu Anda melalui server Discord atau
            pesan pribadi di Instagram! Anda juga bisa mengikuti panduan melalui
            tautan berikut.
          </p>
          <div className="flex gap-3 sm:gap-4 items-center flex-wrap justify-center lg:justify-start">
            <Image
              src="/wa.png"
              alt="WhatsApp"
              width={28}
              height={28}
              className="sm:w-8 sm:h-8"
            />
            <Image
              src="/discord.png"
              alt="Discord"
              width={28}
              height={28}
              className="sm:w-8 sm:h-8"
            />
            <Image
              src="/ig.png"
              alt="Instagram"
              width={28}
              height={28}
              className="sm:w-8 sm:h-8"
            />
            <button className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-600 transition-colors">
              PANDUAN
            </button>
          </div>
        </div>
        <div className="relative w-full max-w-[250px] sm:max-w-[300px] h-[250px] sm:h-[300px] lg:h-[330px] mx-auto">
          {/* Gambar karakter */}
          <Image
            src="/char4.png"
            alt="Help Character"
            width={300}
            height={330}
            className="object-contain w-full h-full"
          />

          <Image
            src="/td1.png"
            alt="Question Left"
            width={90}
            height={90}
            className="absolute top-0 left-1 animate-bounce-slow sm:w-[100px] sm:h-[100px] lg:w-[120px] lg:h-[120px]"
          />

          <Image
            src="/td2.png"
            alt="Question Right"
            width={90}
            height={90}
            className="absolute top-0 right-1 animate-bounce-reverse sm:w-[100px] sm:h-[100px] lg:w-[120px] lg:h-[120px]"
          />
        </div>
      </section>

      {/* Footer */}
    </PublicLayout>
  );
}
