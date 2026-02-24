import type { Transaction, KidBadge } from '@/types'

/**
 * Computes a kid's current point balance by summing approved transactions.
 * Earn transactions add points; redeem transactions subtract points.
 */
export function getKidBalance(kidId: string, transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    if (tx.kidId !== kidId || tx.status !== 'approved') return sum
    return tx.type === 'earn' ? sum + tx.amount : sum - tx.amount
  }, 0)
}

/**
 * Returns the number of pending redemption requests across all kids,
 * or for a specific kid if kidId is provided.
 */
export function countPendingRedemptions(
  transactions: Transaction[],
  kidId?: string,
): number {
  return transactions.filter(
    tx =>
      tx.type === 'redeem' &&
      tx.status === 'pending' &&
      (kidId ? tx.kidId === kidId : true),
  ).length
}

/**
 * Returns the KidBadge records for a specific kid.
 */
export function getKidBadgeRecords(kidId: string, kidBadges: KidBadge[]): KidBadge[] {
  return kidBadges.filter(kb => kb.kidId === kidId)
}

/**
 * Returns transactions for a specific kid, newest first.
 */
export function getKidTransactions(kidId: string, transactions: Transaction[]): Transaction[] {
  return transactions
    .filter(tx => tx.kidId === kidId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
