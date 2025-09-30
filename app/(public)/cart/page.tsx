"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

export default function CartPage() {
  const { user } = useAuth();
  const { items: cartItems, loading, updateQuantity, removeItem } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const router = useRouter();

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item._id));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removeItem(itemId);
    if (success) {
      setSelectedItems((selected) => selected.filter((id) => id !== itemId));
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item._id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih item yang ingin dibeli terlebih dahulu");
      return;
    }

    // Get selected items
    const selectedItemsData = cartItems.filter((item) =>
      selectedItems.includes(item._id)
    );

    // Format data untuk checkout sesuai dengan Transaction model
    const checkoutData = selectedItemsData.map((item) => ({
      // Primary service info (sesuai Transaction model)
      serviceType:
        item.serviceType ||
        (item.type === "rbx5" || item.type === "rbx-instant"
          ? "robux"
          : item.type === "gamepass"
          ? "gamepass"
          : item.type === "joki"
          ? "joki"
          : "robux"),
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      serviceImage: item.serviceImage || item.imgUrl,
      serviceCategory:
        item.serviceCategory ||
        (item.type === "rbx5"
          ? "robux_5_hari"
          : item.type === "rbx-instant"
          ? "robux_instant"
          : undefined),

      // Pricing (sesuai Transaction model)
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.price,
      totalAmount:
        item.totalAmount || (item.unitPrice || item.price) * item.quantity,

      // Legacy fields untuk compatibility
      gameId: item.gameId,
      gameName: item.gameName,
      itemName: item.itemName,
      description: item.description,

      // Service-specific data
      gameType: item.gameType,
      robuxAmount: item.robuxAmount,
      gamepassAmount: item.gamepassAmount,
      estimatedTime: item.estimatedTime,
      additionalInfo: item.additionalInfo,

      // Service details (sesuai Transaction model)
      gamepass: item.gamepass,
      jokiDetails:
        item.jokiDetails ||
        (item.gameType
          ? {
              gameType: item.gameType,
              estimatedTime: item.estimatedTime,
              description: item.description,
              notes: item.additionalInfo,
            }
          : undefined),
      robuxInstantDetails:
        item.robuxInstantDetails ||
        ((item.type === "rbx-instant" || item.serviceType === "robux") &&
        item.serviceCategory === "robux_instant"
          ? {
              notes: item.additionalInfo,
            }
          : undefined),
    }));

    // Store data di sessionStorage untuk checkout
    if (typeof window !== "undefined") {
      // Untuk single item, gunakan format yang ada
      if (checkoutData.length === 1) {
        const item = checkoutData[0];
        sessionStorage.setItem("checkoutData", JSON.stringify(item));
        router.push("/checkout");
      } else {
        // Untuk multiple items, bisa dikembangkan nanti atau proses satu per satu
        toast.info(
          "Saat ini hanya bisa checkout satu item. Silakan pilih satu item terlebih dahulu."
        );
      }
    }
  };

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case "rbx5":
        return "🎮";
      case "rbx-instant":
        return "⚡";
      case "gamepass":
        return "🎫";
      case "joki":
        return "🎯";
      default:
        return "📦";
    }
  };

  const getCategoryName = (type?: string) => {
    switch (type) {
      case "rbx5":
        return "Rbx 5 Hari";
      case "rbx-instant":
        return "Rbx Instant";
      case "gamepass":
        return "Gamepass";
      case "joki":
        return "Joki";
      default:
        return "Unknown";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
            <ShoppingCart className="w-16 h-16 text-primary-100 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Login Diperlukan
            </h2>
            <p className="text-white/70 mb-6">
              Silakan login terlebih dahulu untuk mengakses keranjang belanja
              Anda.
            </p>
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-primary-100 to-primary-200 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300 font-semibold"
            >
              Login Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
              Keranjang Belanja
            </h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100"></div>
          <span className="ml-3 text-white/80">Memuat keranjang...</span>
        </div>
      ) : (
        <div className="px-4 sm:px-6 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Select All */}
                {cartItems.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.length === cartItems.length &&
                          cartItems.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-primary-200/30 bg-white/10 text-primary-100 focus:ring-primary-100/30"
                      />
                      <span className="text-white font-medium">
                        Pilih Semua ({cartItems.length})
                      </span>
                    </label>
                  </div>
                )}

                {/* Cart Items List */}
                {cartItems.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
                    <ShoppingCart className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Keranjang Kosong
                    </h3>
                    <p className="text-white/70 mb-6">
                      Belum ada item yang dipilih
                    </p>
                    <Link
                      href="/"
                      className="inline-block bg-gradient-to-r from-primary-100 to-primary-200 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300 font-semibold"
                    >
                      Mulai Belanja
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:border-primary-200/30 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => toggleSelectItem(item._id)}
                          className="w-4 h-4 mt-1 rounded border-primary-200/30 bg-white/10 text-primary-100 focus:ring-primary-100/30"
                        />

                        {/* Item Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={item.imgUrl}
                            alt={item.itemName}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">
                                  {getCategoryIcon(item.type)}
                                </span>
                                <span className="text-xs text-primary-100 font-medium">
                                  {getCategoryName(item.type)}
                                </span>
                              </div>
                              <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2">
                                {item.itemName}
                              </h3>
                              <p className="text-white/70 text-xs sm:text-sm">
                                {item.gameName}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between">
                            <div className="text-primary-100 font-bold text-sm sm:text-base">
                              Rp {item.price.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item._id,
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="p-1 bg-white/10 border border-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                              >
                                <Minus className="w-3 h-3 text-white" />
                              </button>
                              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item._id,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-all duration-300"
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-white mb-6">
                    Ringkasan Belanja
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-white/70">
                      <span>Total</span>
                      <span className="font-mono">
                        Rp{getSelectedTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-white/70">
                      <div className="mb-2 font-medium">List item</div>
                      {selectedItems.length === 0 ? (
                        <div className="text-white/50 italic">
                          Belum ada item yang dipilih
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {cartItems
                            .filter((item) => selectedItems.includes(item._id))
                            .map((item) => (
                              <div
                                key={item._id}
                                className="flex justify-between text-xs"
                              >
                                <span className="line-clamp-1">
                                  {item.itemName}
                                </span>
                                <span>{item.quantity}x</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    className="w-full bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300"
                  >
                    BELI ({selectedItems.length} ITEM)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
