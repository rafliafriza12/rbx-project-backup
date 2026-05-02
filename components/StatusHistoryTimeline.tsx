"use client";

import React, { useState } from "react";
import { Package, CreditCard, Clock, CheckCircle } from "lucide-react";

interface StatusHistoryTimelineProps {
  transaction: any;
  formatDate: (date: string) => string;
}

const parseStatus = (status: string) => {
  if (status.includes(":")) {
    const [type, statusValue] = status.split(":");
    return { type, status: statusValue };
  }
  const paymentStatuses = ["pending", "settlement", "expired", "cancelled", "failed", "paid"];
  return {
    type: paymentStatuses.includes(status?.toLowerCase()) ? "payment" : "order",
    status: status,
  };
};

export default function StatusHistoryTimeline({
  transaction,
  formatDate,
}: StatusHistoryTimelineProps) {
  const getCustomStatusInfo = (statusRaw: string) => {
    const parsed = parseStatus(statusRaw);
    const type = parsed.type;
    const status = parsed.status;
    const category = transaction.serviceCategory;
    const serviceType = transaction.serviceType;

    let label = status.toUpperCase();
    let note = "";

    // Default Labels
    const labels: Record<string, string> = {
      pending: "PENDING",
      settlement: "BAYAR",
      paid: "BAYAR",
      expired: "KADALUARSA",
      cancelled: "DIBATALKAN",
      failed: "GAGAL",
      waiting_payment: "MENUNGGU PEMBAYARAN",
      processing: "DI SIAPKAN",
      in_progress: "SEDANG DIKERJAKAN",
      completed: "TERKIRIM",
    };
    label = labels[status] || label;

    // Payment Notes
    if (type === "payment" && (status === "settlement" || status === "paid")) {
      note = "Pembayaran via Payment Berhasil";
    }

    // RBX 5 Hari
    if (category === "robux_5_hari") {
      if (status === "pending" && type === "order") {
        label = "DI SIAPKAN";
        note = "Pesanan Sedang di siapkan oleh tim rbxnet";
      } else if (status === "processing") {
        label = "TERKIRIM";
        note = "Robux udah pending di dalam akun";
      } else if (status === "in_progress" || status === "completed") {
        label = "TERKIRIM";
        note = "Yay, Pesanan sudah berhasil terkirim , ditunggu orderan selanjutnya di rbxnet ya!";
      }
    } 
    // RBX Instant
    else if (category === "robux_instant" || serviceType === "robux") {
      if ((status === "pending" && type === "order") || status === "processing") {
        label = "DI SIAPKAN";
        note = "Pesanan akan segera di proses oleh tim rbxnet";
      } else if (status === "completed") {
        label = "TERKIRIM";
        note = "Yay, Pesanan sudah berhasil terkirim , ditunggu orderan selanjutnya di rbxnet ya!";
      }
    } 
    // Gamepass
    else if (serviceType === "gamepass") {
      if ((status === "pending" && type === "order") || status === "waiting_payment") {
        label = "DI SIAPKAN";
        note = "Pesanan akan segera di proses oleh tim rbxnet";
      } else if (status === "processing" || status === "in_progress") {
        label = "SIAP DIKIRIM";
        note = "Yuk hubungi customer support rbxnet untuk klaim gamepassnya melalui chat";
      } else if (status === "completed") {
        label = "TERKIRIM";
        note = "Yay, Pesanan sudah berhasil terkirim , ditunggu orderan selanjutnya di rbxnet ya!";
      }
    }

    return { label, note, type };
  };

  if (!transaction.statusHistory || transaction.statusHistory.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-base text-white/60">Belum ada riwayat status</p>
      </div>
    );
  }

  // Determine latest status and history items
  const statusHistory = transaction.statusHistory;
  const latestStatus = statusHistory[statusHistory.length - 1];
  
  // Custom info for latest
  const { label: latestLabel, note: latestNote, type: latestType } = getCustomStatusInfo(latestStatus.status);
  
  const isSystemNote = (n?: string) => {
    if (!n) return true;
    const lower = n.toLowerCase();
    return (
      lower.startsWith("status updated by admin") ||
      lower.startsWith("status updated automatically") ||
      lower.startsWith("order status updated") ||
      lower.startsWith("transaction marked as") ||
      lower.startsWith("payment status updated")
    );
  };

  let finalLatestNote = latestNote;
  if (latestStatus.notes && !isSystemNote(latestStatus.notes) && latestStatus.notes !== latestNote) {
    finalLatestNote = latestNote ? `${latestNote}\n\nCatatan Admin: ${latestStatus.notes}` : latestStatus.notes;
  }

  // The older statuses
  const olderHistory = [...statusHistory].slice(0, statusHistory.length - 1).reverse();

  return (
    <div className="space-y-6">
      {/* 1. LATEST STATUS CARD */}
      <CurrentStatusCard 
        label={latestLabel}
        note={finalLatestNote}
        date={formatDate(latestStatus.timestamp || latestStatus.updatedAt)}
        rawDate={latestStatus.timestamp || latestStatus.updatedAt}
        type={latestType}
        imageUrl={latestStatus.imageUrl}
        transaction={transaction}
        statusValue={parseStatus(latestStatus.status).status}
      />

      {/* 2. HISTORY TIMELINE FOR OLDER STATUSES */}
      {olderHistory.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-medium text-white/50 mb-4 uppercase tracking-wider">Riwayat Sebelumnya</h4>
          <div className="space-y-4">
            {olderHistory.map((history: any, index: number) => {
              const { label, type } = getCustomStatusInfo(history.status);
              
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border ${
                      type === "payment" 
                        ? "bg-purple-500/20 border-purple-500/30 text-purple-400" 
                        : "bg-pink-500/20 border-pink-500/30 text-pink-400"
                    }`}>
                      {type === "payment" ? (
                        <CreditCard className="w-5 h-5" />
                      ) : (
                        <Package className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white uppercase text-sm sm:text-base">
                            {label}
                          </span>
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${
                            type === "payment" 
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                          }`}>
                            {type === "payment" ? "Pembayaran" : "Pesanan"}
                          </span>
                        </div>
                        {getCustomStatusInfo(history.status).note && (
                          <p className="text-sm text-white/80 mt-1.5 leading-relaxed font-medium">
                            {getCustomStatusInfo(history.status).note}
                          </p>
                        )}
                        {history.notes && !isSystemNote(history.notes) && (
                          <p className="text-sm text-white/70 mt-1 mb-2 italic">
                            Catatan Admin: {history.notes}
                          </p>
                        )}
                        {history.imageUrl && (
                          <a href={history.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                            <img
                              src={history.imageUrl}
                              alt="Bukti transaksi"
                              className="max-w-full sm:max-w-xs rounded-lg border border-white/20 hover:border-primary-100/50 transition-all cursor-pointer shadow-sm"
                            />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-white/50 flex-shrink-0 mt-1 sm:mt-0">
                        {formatDate(history.timestamp || history.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentStatusCard({
  label,
  note,
  date,
  rawDate,
  type,
  imageUrl,
  transaction,
  statusValue,
}: {
  label: string;
  note: string;
  date: string;
  rawDate: string;
  type: string;
  imageUrl?: string;
  transaction: any;
  statusValue: string;
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Show timer condition
  const showTimer = 
    transaction.serviceCategory === "robux_5_hari" && 
    statusValue === "processing";

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden transition-all hover:border-white/20">
      {/* Background glow for current status */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/10 via-primary-200/10 to-primary-100/10 blur-xl opacity-50 z-0"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
            {type === "payment" ? (
              <CreditCard className="w-6 h-6 text-primary-200" />
            ) : (
              <Package className="w-6 h-6 text-primary-100" />
            )}
          </div>
          <div>
            <div className="text-xs text-white/60 font-medium mb-0.5">Status transaksi saat ini</div>
            <div className="font-bold text-white text-xl leading-tight uppercase tracking-wide drop-shadow-md">
              {label}
            </div>
            <div className="text-xs text-white/40 mt-1">{date}</div>
          </div>
        </div>
        
        {note && (
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="self-start sm:self-center px-4 py-1.5 border border-white/20 rounded-full text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors bg-white/5 whitespace-nowrap shadow-sm"
          >
            {isVisible ? "Sembunyikan" : "Tampilkan"}
          </button>
        )}
      </div>

      {isVisible && note && (
        <div className="relative z-10 bg-emerald-500/10 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-emerald-300 font-medium whitespace-pre-wrap border border-emerald-500/20 shadow-inner">
          {note}
          {showTimer && <DynamicCountdown startDate={rawDate} />}
        </div>
      )}

      {isVisible && imageUrl && (
        <div className="relative z-10 mt-5">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block group">
            <img
              src={imageUrl}
              alt="Bukti transaksi"
              className="max-w-full sm:max-w-md rounded-xl border border-white/20 group-hover:border-primary-100/50 transition-all cursor-pointer shadow-lg group-hover:shadow-primary-100/20"
            />
          </a>
        </div>
      )}
    </div>
  );
}

function DynamicCountdown({ startDate }: { startDate: string }) {
  const [timeLeft, setTimeLeft] = React.useState("");
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    if (!startDate) return;
    
    // 5 days after startDate
    const estimatedDate = new Date(new Date(startDate).getTime() + (5 * 24 * 60 * 60 * 1000));
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = estimatedDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days} Hari ${hours} Jam ${minutes} Menit ${seconds} Detik`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (isExpired) {
    return (
      <div className="mt-3 pt-3 border-t border-emerald-500/20 text-sm font-bold flex items-center gap-2 text-emerald-200">
         <CheckCircle className="w-5 h-5 text-emerald-400" /> Robux seharusnya sudah masuk ke akunmu!
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-emerald-500/20 text-sm font-bold flex flex-col gap-1 text-emerald-200">
       <div className="flex items-center gap-2">
         <Clock className="w-5 h-5 text-emerald-400 animate-pulse" /> Estimasi Robux Masuk:
       </div>
       <div className="text-emerald-300 font-mono text-base ml-7">
         {timeLeft}
       </div>
    </div>
  );
}
