"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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

export default function JokiDetailPage() {
  const [joki, setJoki] = useState<Joki | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<JokiItem | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const params = useParams();
  const router = useRouter();
  const jokiId = params.id as string;

  // Check if all required fields are filled
  const isFormValid =
    selectedItem !== null && username.trim() !== "" && password.trim() !== "";

  useEffect(() => {
    if (jokiId) {
      fetchJoki();
    }
  }, [jokiId]);

  const fetchJoki = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/joki/${jokiId}`);
      const data = await response.json();

      if (response.ok) {
        setJoki(data.joki);
        // Auto select first item if available
        if (data.joki.item.length > 0) {
          setSelectedItem(data.joki.item[0]);
        }
      } else {
        setError(data.error || "Joki service tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching joki service:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    console.log("=== JOKI PURCHASE DEBUG START ===");
    console.log("1. handlePurchase called");
    console.log("2. Form validation:", {
      isFormValid,
      selectedItem: !!selectedItem,
      joki: !!joki,
    });

    if (!isFormValid || !selectedItem || !joki) {
      console.log("3. Validation failed, aborting purchase");
      return;
    }

    console.log("4. Creating checkout data...");
    // Redirect to new checkout system
    const checkoutData = {
      serviceType: "joki",
      serviceId: joki._id,
      serviceName: `${joki.gameName} - ${selectedItem.itemName}`,
      serviceImage: joki.imgUrl,
      quantity: 1,
      unitPrice: selectedItem.price,
      // Add description and gameType at top level for auto-fill
      description: selectedItem.description,
      gameType: joki.gameName,
      robloxUsername: username,
      robloxPassword: password,
      jokiDetails: {
        gameName: joki.gameName,
        itemName: selectedItem.itemName,
        description: selectedItem.description,
        notes: additionalInfo, // Kirim additionalInfo sebagai notes
        additionalInfo: additionalInfo,
        requirements: joki.requirements,
        features: joki.features,
      },
    };

    console.log("5. Checkout data created:", checkoutData);

    // Check sessionStorage availability
    const isSessionStorageAvailable = () => {
      try {
        const test = "__test__";
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    };

    console.log("6. SessionStorage available:", isSessionStorageAvailable());

    // Store in sessionStorage for checkout page
    try {
      console.log("7. Attempting to store data in sessionStorage...");
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      console.log("8. Data stored successfully");

      // Verify data was stored
      const stored = sessionStorage.getItem("checkoutData");
      console.log("9. Verified stored data:", stored);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("10. Parsed stored data successfully:", parsed);
        } catch (parseError) {
          console.error("11. Error parsing stored data:", parseError);
        }
      } else {
        console.error("11. No data found after storage attempt");
      }
    } catch (storageError) {
      console.error("7. Error storing data in sessionStorage:", storageError);
    }

    // Create URL params as backup
    const urlParams = new URLSearchParams({
      serviceType: checkoutData.serviceType,
      serviceId: checkoutData.serviceId,
      serviceName: checkoutData.serviceName,
      serviceImage: checkoutData.serviceImage,
      quantity: checkoutData.quantity.toString(),
      unitPrice: checkoutData.unitPrice.toString(),
    });

    console.log("12. URL params created as backup:", urlParams.toString());

    // Navigate with both sessionStorage and URL params
    console.log("13. Navigating to checkout page...");

    // Use setTimeout to ensure sessionStorage is properly set before navigation
    setTimeout(() => {
      console.log("14. Delayed navigation executing...");
      router.push(`/checkout?${urlParams.toString()}`);
    }, 100);

    console.log("=== JOKI PURCHASE DEBUG END ===");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Memuat jasa joki...</span>
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
          onClick={fetchJoki}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!joki) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Joki service tidak ditemukan</p>
        <button
          onClick={() => router.push("/joki")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          Kembali ke Daftar Joki
        </button>
      </div>
    );
  }

  return (
    <main className="">
      <div className="max-w-6xl mx-auto ">
        <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] relative rounded-lg overflow-hidden">
          <Image src={joki.imgUrl} alt="banner" fill className="object-cover" />
        </div>
      </div>

      <section className="max-w-6xl mx-auto bg-[#e28686] rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 z-10 relative flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-lg">
        <div className="flex-shrink-0 self-center sm:self-start mx-4">
          <Image
            src={joki.imgUrl}
            alt={joki.gameName}
            width={120}
            height={120}
            className="sm:w-[150px] sm:h-[150px] rounded-md object-cover mx-auto sm:mx-0"
          />
        </div>

        <div className="flex flex-col justify-between w-full text-center sm:text-left mx-4">
          <div className="mt-2 sm:mt-5">
            <h1 className="text-lg sm:text-xl font-bold text-black leading-tight">
              Jasa Joki {joki.gameName}
            </h1>
            <p className="text-sm text-black/80">
              Professional Gaming Service{" "}
              <span className="text-blue-600">✔️</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 sm:gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-black/80 mt-3 sm:mt-4">
            {joki.features.map((feature, index) => (
              <span key={index} className="flex items-center gap-1">
                <span className="text-blue-500">✅</span> {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 ">
        {/* Cara Pesan & Requirements */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#e28686] rounded-xl p-4 w-full h-auto flex flex-col justify-start">
            <h2 className="text-black font-extrabold text-base sm:text-lg mb-2 text-center lg:text-left">
              Cara pesan :
            </h2>
            <ol className="list-decimal list-inside text-black text-sm font-medium space-y-1 text-center lg:text-left">
              {joki.caraPesan.map((cara, index) => (
                <li key={index}>{cara}</li>
              ))}
            </ol>
          </div>

          <div className="bg-[#e28686] rounded-xl p-4 w-full h-auto flex flex-col justify-start">
            <h2 className="text-black font-extrabold text-base sm:text-lg mb-2 text-center lg:text-left">
              Syarat & Ketentuan :
            </h2>
            <ul className="list-disc list-inside text-black text-sm font-medium space-y-1 text-center lg:text-left">
              {joki.requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Form Fields */}
          <div className="bg-[#e28686] rounded p-3 sm:p-4 space-y-4 w-full mx-auto lg:mx-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-1 block text-black">
                  Username Roblox *
                </label>
                <div className="flex items-center border border-black rounded overflow-hidden bg-white">
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

              <div>
                <label className="text-sm font-bold mb-1 block text-black">
                  Password Roblox *
                </label>
                <div className="flex items-center border border-black rounded overflow-hidden bg-white">
                  <div className="px-3 py-2 border-r border-black bg-[#d06565] flex items-center justify-center">
                    <Image
                      src="/gembok.png"
                      alt="lock"
                      width={25}
                      height={20}
                    />
                  </div>
                  <input
                    type="password"
                    placeholder="Masukkan Password Roblox"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-2 px-3 outline-none text-sm text-black flex-1 min-w-0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold mb-1 block text-black">
                Backup Code (Opsional)
              </label>
              <textarea
                placeholder="Berikan informasi kode keamanan jika akun anda memiliki 2 step verification"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className="w-full py-2 px-3 outline-none text-sm text-black border border-black rounded"
              />
              <h1 className="text-xs">
                Klik link berikut untuk melihat kode keamanan anda.{" "}
                <Link
                  className="underline text-blue-500"
                  href={"https://youtu.be/0N-1478Qki0?si=Z2g_AuTIOQPn5kDC"}
                  target="_blank"
                >
                  Backup Code
                </Link>
              </h1>
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-[#e28686] rounded-xl p-4 sm:p-5">
            <h2 className="font-extrabold text-base mb-4 text-black text-center lg:text-left">
              Pilih Layanan Joki :
            </h2>
            {joki.item.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {joki.item.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className={`rounded-xl p-4 flex flex-col text-left transition-all duration-300 ${
                      selectedItem?.itemName === item.itemName
                        ? "bg-[#FF9C01] scale-[1.01] shadow-lg"
                        : "bg-[#d76262] hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="overflow-hidden rounded-lg w-[60px] h-[60px] flex items-center justify-center flex-shrink-0 relative">
                        <Image
                          src={item.imgUrl}
                          alt={item.itemName}
                          fill
                          className="object-cover rounded w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white mb-1">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-white/80 mb-2 line-clamp-2">
                          {item.description}
                        </div>
                        <div className="text-sm text-black font-extrabold">
                          Rp. {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">
                  Belum ada layanan tersedia untuk game ini
                </p>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Perhatian!</h3>
                <div className="mt-2 text-sm">
                  <p>
                    Pastikan akun Roblox Anda aman dan tidak sedang digunakan
                    oleh orang lain. Kami tidak bertanggung jawab atas
                    kehilangan item atau ban yang disebabkan oleh pelanggaran
                    Terms of Service Roblox.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
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
              Pesan Joki Sekarang -{" "}
              {selectedItem
                ? `Rp. ${selectedItem.price.toLocaleString()}`
                : "Pilih layanan dulu"}
              <Image
                src="/beli.png"
                alt="cart"
                width={18}
                height={18}
                className="sm:w-5 sm:h-5"
              />
            </button>
          </div>
          {joki && (
            <ReviewSection
              serviceType="joki"
              serviceId={joki._id}
              serviceName={joki.gameName}
              title={`Reviews ${joki.gameName}`}
            />
          )}
        </div>
      </section>

      {/* Review Section */}
    </main>
  );
}
