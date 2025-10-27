/**
 * Helper functions for handling multi-checkout transactions
 */

import { Transaction } from "@/types";

/**
 * Check if transaction is part of multi-checkout
 */
export function isMultiCheckout(transaction: Transaction): boolean {
  return !!(
    transaction.isMultiCheckout ||
    (transaction.relatedTransactions &&
      transaction.relatedTransactions.length > 0)
  );
}

/**
 * Get all transactions in a checkout (main + related)
 */
export function getAllTransactions(transaction: Transaction): Transaction[] {
  if (!transaction) return [];
  return [transaction, ...(transaction.relatedTransactions || [])];
}

/**
 * Calculate grand total for all transactions in checkout
 * Grand Total = Sum of all finalAmount + Payment Fee (only in main transaction)
 */
export function calculateGrandTotal(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);

  console.log(
    "[calculateGrandTotal] All transactions:",
    allTransactions.length
  );
  console.log(
    "[calculateGrandTotal] Transactions:",
    allTransactions.map((t) => ({
      id: t._id,
      invoice: t.invoiceId,
      finalAmount: t.finalAmount,
      totalAmount: t.totalAmount,
    }))
  );

  // Sum all finalAmount (already includes discount)
  const totalAfterDiscount = allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );

  console.log(
    "[calculateGrandTotal] Total after discount:",
    totalAfterDiscount
  );

  // Add payment fee (only stored in main/first transaction)
  const paymentFee = getPaymentFee(transaction);

  console.log("[calculateGrandTotal] Payment fee:", paymentFee);
  console.log(
    "[calculateGrandTotal] Grand total:",
    totalAfterDiscount + paymentFee
  );

  return totalAfterDiscount + paymentFee;
}

/**
 * Calculate original total (before discount) for all transactions
 */
export function calculateOriginalTotal(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
}

/**
 * Calculate total discount for all transactions
 */
export function calculateTotalDiscount(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
}

/**
 * Get payment fee (search in all related transactions, not just main)
 */
export function getPaymentFee(transaction: Transaction): number {
  // Check main transaction first
  if (transaction.paymentFee && transaction.paymentFee > 0) {
    return transaction.paymentFee;
  }

  // If not in main, check related transactions
  if (
    transaction.relatedTransactions &&
    transaction.relatedTransactions.length > 0
  ) {
    for (const relatedTx of transaction.relatedTransactions) {
      if (relatedTx.paymentFee && relatedTx.paymentFee > 0) {
        return relatedTx.paymentFee;
      }
    }
  }

  // No payment fee found
  return 0;
}

/**
 * Calculate subtotal after discount (before payment fee)
 */
export function calculateSubtotalAfterDiscount(
  transaction: Transaction
): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );
}

/**
 * Get total items count in checkout
 */
export function getTotalItemsCount(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce((sum, t) => sum + t.quantity, 0);
}

/**
 * Get display name for transaction group
 */
export function getCheckoutDisplayName(transaction: Transaction): string {
  if (!isMultiCheckout(transaction)) {
    return transaction.serviceName;
  }

  const allTransactions = getAllTransactions(transaction);
  const totalItems = allTransactions.length;

  return `${totalItems} Items dalam Pesanan`;
}

/**
 * Group transactions by Roblox username (untuk multi-account checkout di masa depan)
 */
export function groupTransactionsByAccount(
  transaction: Transaction
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();
  const allTransactions = getAllTransactions(transaction);

  allTransactions.forEach((t) => {
    const username = t.robloxUsername || "Unknown";
    if (!grouped.has(username)) {
      grouped.set(username, []);
    }
    grouped.get(username)!.push(t);
  });

  return grouped;
}

/**
 * Check if all transactions have same status
 */
export function hasSameOrderStatus(transaction: Transaction): boolean {
  const allTransactions = getAllTransactions(transaction);
  if (allTransactions.length <= 1) return true;

  const firstStatus = allTransactions[0].orderStatus;
  return allTransactions.every((t) => t.orderStatus === firstStatus);
}

/**
 * Get unique service types in checkout
 */
export function getServiceTypes(transaction: Transaction): string[] {
  const allTransactions = getAllTransactions(transaction);
  const types = new Set(allTransactions.map((t) => t.serviceType));
  return Array.from(types);
}
