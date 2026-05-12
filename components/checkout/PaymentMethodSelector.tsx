"use client";

import React from "react";
import { ChevronDown, ChevronUp, CheckCircle2, QrCode, Wallet, Building2, Store, CreditCard } from "lucide-react";
import { 
  PaymentCategory, 
  isPaymentMethodAvailable, 
  calculatePaymentFee, 
  getTransactionLimitMessage, 
  formatCurrency 
} from "@/lib/payment-helpers";

interface PaymentMethodSelectorProps {
  categories: PaymentCategory[];
  loading: boolean;
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  expandedCategory: string;
  onToggleCategory: (categoryId: string) => void;
  baseAmount: number;
}

export default function PaymentMethodSelector({
  categories,
  loading,
  selectedMethod,
  onSelectMethod,
  expandedCategory,
  onToggleCategory,
  baseAmount,
}: PaymentMethodSelectorProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-100"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        Metode pembayaran tidak tersedia saat ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Saldo Internal / RBXNET Credits displayed at the very top without accordion */}
      {categories.find(c => c.id === "internal")?.methods.map((method) => {
        const isAvailable = isPaymentMethodAvailable(method, baseAmount);
        const fee = calculatePaymentFee(baseAmount, method);
        const limitMessage = getTransactionLimitMessage(method, baseAmount);

        return (
          <div
            key={method.id}
            onClick={() => isAvailable && onSelectMethod(method.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              !isAvailable
                ? "border-primary-600/30 bg-primary-800/30 cursor-not-allowed opacity-60 grayscale"
                : selectedMethod === method.id
                  ? "border-primary-100 bg-primary-100/10 shadow-lg cursor-pointer"
                  : "border-primary-600/50 bg-primary-700/20 hover:border-primary-100/50 hover:bg-primary-600/20 cursor-pointer"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                {(method.icon && (method.icon.startsWith("http") || method.icon.startsWith("/"))) ? (
                  <img
                    src={method.icon}
                    alt={method.name}
                    className={`w-8 h-8 object-contain mr-3 ${method.icon.startsWith("http") ? "bg-white rounded p-1" : "drop-shadow-lg"}`}
                  />
                ) : (
                  <span className={`text-lg mr-2 ${!isAvailable ? "opacity-50" : ""}`}>
                    {method.icon}
                  </span>
                )}
                <span className={`font-bold text-base ${!isAvailable ? "text-white/50" : "text-white"}`}>
                  {method.name}
                </span>
              </div>
              <div className="text-right flex items-center gap-2">
                {selectedMethod === method.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary-100" fill="currentColor" />
                )}
                {!isAvailable && limitMessage ? (
                  <div className="text-xs text-red-400 font-medium">
                    {limitMessage}
                  </div>
                ) : (
                  <div className="text-sm text-yellow-400 font-bold">
                    {method.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {categories.filter(c => c.id !== "internal").map((category) => {
        const availableMethodsCount = category.methods.filter(
          (method) => isPaymentMethodAvailable(method, baseAmount),
        ).length;
        const totalMethodsCount = category.methods.length;

        return (
          <div key={category.id} className="border border-primary-200/20 rounded-xl overflow-hidden bg-primary-900/20">
            <button
              type="button"
              onClick={() => onToggleCategory(category.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-primary-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100/20 to-primary-200/20 flex items-center justify-center">
                  {category.name.toLowerCase().includes("qris") && <QrCode className="w-5 h-5 text-primary-100" />}
                  {category.name.toLowerCase().includes("e-wallet") && <Wallet className="w-5 h-5 text-primary-100" />}
                  {category.name.toLowerCase().includes("virtual account") && <Building2 className="w-5 h-5 text-primary-100" />}
                  {category.name.toLowerCase().includes("retail") && <Store className="w-5 h-5 text-primary-100" />}
                  {!category.name.toLowerCase().match(/qris|e-wallet|virtual account|retail/) && <CreditCard className="w-5 h-5 text-primary-100" />}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white">
                    {category.name}
                    {availableMethodsCount < totalMethodsCount && (
                      <span className="ml-2 text-xs font-normal text-primary-400">
                        ({availableMethodsCount}/{totalMethodsCount} tersedia)
                      </span>
                    )}
                  </h4>
                </div>
              </div>
              {expandedCategory === category.id ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )}
            </button>

            {expandedCategory === category.id && (
              <div className="border-t border-primary-200/10 p-4 pt-3">
                <div className="grid grid-cols-1 gap-3">
                  {category.methods?.map((method) => {
                    const isAvailable = isPaymentMethodAvailable(method, baseAmount);
                    const fee = calculatePaymentFee(baseAmount, method);
                    const limitMessage = getTransactionLimitMessage(method, baseAmount);

                    return (
                      <div
                        key={method.id}
                        onClick={() => isAvailable && onSelectMethod(method.id)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          !isAvailable
                            ? "border-primary-600/30 bg-primary-800/30 cursor-not-allowed opacity-60 grayscale"
                            : selectedMethod === method.id
                              ? "border-primary-100 bg-primary-100/10 shadow-lg cursor-pointer"
                              : "border-primary-600/50 bg-primary-700/20 hover:border-primary-100/50 hover:bg-primary-600/20 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            {method.icon && method.icon.startsWith("http") ? (
                              <img
                                src={method.icon}
                                alt={method.name}
                                className={`w-12 h-8 object-contain rounded bg-white p-1 mr-3`}
                              />
                            ) : (
                              <span className={`text-lg mr-2 ${!isAvailable ? "opacity-50" : ""}`}>
                                {method.icon}
                              </span>
                            )}
                            <span className={`font-semibold text-sm ${!isAvailable ? "text-white/50" : "text-white"}`}>
                              {method.name}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            {selectedMethod === method.id && (
                              <CheckCircle2 className="w-4 h-4 text-primary-100" fill="currentColor" />
                            )}
                            {!isAvailable && limitMessage ? (
                              <div className="text-xs text-red-400 font-medium">
                                {limitMessage}
                              </div>
                            ) : (
                              <div className="text-xs text-white font-medium">
                                + {method.feeType === "percentage" ? `${method.fee}%` : formatCurrency(fee)}
                              </div>
                            )}
                          </div>
                        </div>
                        {method.description && (
                          <p className={`text-xs mt-1 ${!isAvailable ? "text-white/40" : "text-white/70"}`}>
                            {method.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
