"use client";

import React from "react";
import { formatCurrency } from "@/lib/payment-helpers";

export interface OrderSummaryItem {
  label: string;
  value: React.ReactNode;
}

interface OrderSummaryCardProps {
  details: OrderSummaryItem[];
  baseAmount: number;
  adminFee?: number;
  discount?: number;
  discountPercentage?: number;
  paymentFee?: number;
  promoCode?: string;
  onPromoCodeChange?: (code: string) => void;
  onApplyPromo?: () => void;
  promoDiscount?: number;
  appliedPromoCode?: string;
}

export default function OrderSummaryCard({
  details,
  baseAmount,
  adminFee = 0,
  discount = 0,
  discountPercentage = 0,
  paymentFee = 0,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  promoDiscount = 0,
  appliedPromoCode,
}: OrderSummaryCardProps) {
  const finalAmount = baseAmount + adminFee - discount - promoDiscount + paymentFee;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
      <div className="space-y-4 text-sm sm:text-base text-white/90">
        {/* Render Details List */}
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between items-center pb-3 border-b border-white/10">
            <span className="text-white/60">{detail.label}</span>
            <span className="font-semibold">{detail.value}</span>
          </div>
        ))}

        {/* Pricing Summary */}
        <div className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Total Harga</span>
            <span className="font-semibold">{formatCurrency(baseAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/60">Biaya Admin</span>
            <span className="font-semibold">{formatCurrency(adminFee)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-green-400">Diskon Member {discountPercentage > 0 ? `(${discountPercentage}%)` : ''}</span>
              <span className="font-semibold text-green-400">- {formatCurrency(discount)}</span>
            </div>
          )}

          {promoDiscount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-green-400">Promo ({appliedPromoCode})</span>
              <span className="font-semibold text-green-400">- {formatCurrency(promoDiscount)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <span className="text-white/60">Biaya Layanan</span>
            <span className="font-semibold">{formatCurrency(paymentFee)}</span>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-primary-100">Total Akhir</span>
            <span className="text-xl font-black text-primary-100">
              {formatCurrency(finalAmount)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Promo Code Input (Optional) */}
      {onPromoCodeChange && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-white/10">
          <input
            type="text"
            placeholder="Masukkan Kode Promo"
            value={promoCode || ""}
            onChange={(e) => onPromoCodeChange(e.target.value)}
            disabled={!!appliedPromoCode}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-100/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={onApplyPromo}
            disabled={!promoCode || !!appliedPromoCode}
            className={`px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${appliedPromoCode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            {appliedPromoCode ? 'Terpakai' : 'Terapkan'}
          </button>
        </div>
      )}
    </div>
  );
}
