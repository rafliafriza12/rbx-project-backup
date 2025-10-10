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
 */
export function calculateGrandTotal(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );
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
