"use client";

import { useState, useEffect, useRef } from "react";

interface Transaction {
  _id: string;
  invoiceId: string;
  serviceName: string;
  serviceType: string;
  totalAmount: number;
  finalAmount: number;
  serviceImage?: string;
  createdAt: string;
}

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomType: 'general' | 'order', transactionCode?: string, transactionTitle?: string) => Promise<void>;
  userName?: string;
}

export default function CreateChatRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  userName,
}: CreateChatRoomModalProps) {
  const [selectedType, setSelectedType] = useState<'general' | 'order' | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search transactions with debouncing
  useEffect(() => {
    if (selectedType !== 'order' || searchQuery.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/transactions/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Error searching transactions:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedType]);

  if (!isOpen) return null;

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionCode(transaction.invoiceId);
    setSearchQuery(transaction.invoiceId);
    setShowDropdown(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      setError("Pilih tipe ruang chat");
      return;
    }

    if (selectedType === 'order') {
      if (!selectedTransaction) {
        setError("Pilih transaksi dari daftar");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");
      
      if (selectedType === 'order' && selectedTransaction) {
        await onCreateRoom(selectedType, selectedTransaction.invoiceId, selectedTransaction.serviceName);
      } else {
        await onCreateRoom(selectedType);
      }
      
      // Reset form
      setSelectedType(null);
      setTransactionCode("");
      setSelectedTransaction(null);
      setSearchQuery("");
      setSearchResults([]);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal membuat ruang chat");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedType(null);
      setTransactionCode("");
      setSelectedTransaction(null);
      setSearchQuery("");
      setSearchResults([]);
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-purple/30 to-neon-pink/30 px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg">Buat Ruang Chat Baru</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Judul Ruang */}
          <div>
            <label className="text-white/80 text-sm font-medium mb-3 block">Judul Ruang</label>
            <input
              type="text"
              value={selectedType === 'general' ? `Chat Support - ${userName || 'User'}` : transactionCode ? `Order Support - ${transactionCode}` : ''}
              readOnly
              className="w-full bg-primary-700/50 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm"
              placeholder="Otomatis dari username Anda"
            />
            <p className="text-white/40 text-xs mt-1.5">Judul ruang dibuat otomatis dari username Anda</p>
          </div>

          {/* Tipe Ruang */}
          <div>
            <label className="text-white/80 text-sm font-medium mb-3 block">Tipe Ruang</label>
            <div className="space-y-3">
              {/* General Support */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('general');
                  setTransactionCode("");
                  setError("");
                }}
                disabled={loading}
                className={`w-full bg-gradient-to-r from-primary-700/50 to-primary-600/50 hover:from-primary-700/70 hover:to-primary-600/70 border rounded-xl px-4 py-4 text-left transition-all disabled:opacity-50 ${
                  selectedType === 'general' 
                    ? 'border-neon-pink shadow-lg shadow-neon-pink/20' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'general' ? 'bg-white' : 'border-white/30'
                  }`}>
                    {selectedType === 'general' && (
                      <div className="w-3 h-3 bg-neon-pink rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm mb-0.5 flex items-center gap-2">
                      <svg className="w-5 h-5 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      General Support
                    </div>
                    <p className="text-white/50 text-xs">Chat umum dengan admin support</p>
                  </div>
                </div>
              </button>

              {/* Order Support */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('order');
                  setError("");
                }}
                disabled={loading}
                className={`w-full bg-gradient-to-r from-primary-700/50 to-primary-600/50 hover:from-primary-700/70 hover:to-primary-600/70 border rounded-xl px-4 py-4 text-left transition-all disabled:opacity-50 ${
                  selectedType === 'order' 
                    ? 'border-neon-pink shadow-lg shadow-neon-pink/20' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'order' ? 'bg-white' : 'border-white/30'
                  }`}>
                    {selectedType === 'order' && (
                      <div className="w-3 h-3 bg-neon-pink rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm mb-0.5 flex items-center gap-2">
                      <svg className="w-5 h-5 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order Support
                    </div>
                    <p className="text-white/50 text-xs">Bantuan untuk pesanan tertentu</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Kode Transaksi - Only show if order support selected */}
          {selectedType === 'order' && (
            <div className="animate-fadeIn">
              <label className="text-white/80 text-sm font-medium mb-2 block">Pilih Transaksi</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedTransaction(null);
                    setTransactionCode("");
                    setError("");
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Ketik kode invoice atau nama produk..."
                  className="w-full bg-gradient-to-r from-primary-700/50 to-primary-600/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-transparent transition-all"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-neon-pink rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Search Results - Inline (not absolute) so modal can scroll */}
              {showDropdown && searchResults.length > 0 && (
                <div className="mt-3 bg-primary-800/80 border border-white/20 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                  <div className="px-3 py-2 bg-primary-700/50 border-b border-white/10">
                    <p className="text-white/60 text-xs font-medium">
                      Ditemukan {searchResults.length} transaksi
                    </p>
                  </div>
                  <div className="max-h-52 overflow-y-auto custom-scrollbar">
                    {searchResults.map((transaction) => (
                      <button
                        key={transaction._id}
                        type="button"
                        onClick={() => handleSelectTransaction(transaction)}
                        className="w-full px-4 py-3 hover:bg-primary-700/50 transition-colors border-b border-white/5 last:border-b-0 text-left flex items-center gap-3"
                      >                        
                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{transaction.invoiceId}</p>
                          <p className="text-white/60 text-xs truncate">{transaction.serviceName}</p>
                          <p className="text-neon-pink text-xs font-medium mt-0.5">
                            Rp {transaction.finalAmount.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Type Badge */}
                        <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-md font-medium">
                            {transaction.serviceType}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results - Also inline */}
              {showDropdown && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                <div className="mt-3 bg-primary-800/80 border border-white/20 rounded-xl shadow-lg p-4 text-center animate-fadeIn">
                  <svg className="w-12 h-12 text-white/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white/60 text-sm">Transaksi tidak ditemukan</p>
                  <p className="text-white/40 text-xs mt-1">Coba gunakan kode invoice yang berbeda</p>
                </div>
              )}
              
              {/* Selected Transaction Display */}
              {selectedTransaction && (
                <div className="mt-3 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 border border-neon-pink/30 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-pink rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{selectedTransaction.invoiceId}</p>
                      <p className="text-white/70 text-xs truncate">{selectedTransaction.serviceName}</p>
                      <p className="text-neon-pink text-xs font-medium mt-0.5">
                        Rp {selectedTransaction.finalAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-white/40 text-xs mt-2">
                Minimal 3 karakter untuk mencari transaksi Anda
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-6 py-4 bg-primary-900/50 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-primary-700/50 hover:bg-primary-700/70 border border-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedType || (selectedType === 'order' && !selectedTransaction)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-800 disabled:cursor-not-allowed text-white px-6 py-3 disabled:opacity-40 font-semibold transition-all shadow-lg hover:shadow-primary-600/50 disabled:shadow-none rounded-xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                <span>Membuat...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Ruang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
