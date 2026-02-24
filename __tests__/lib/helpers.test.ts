import {
  getKidBalance,
  countPendingRedemptions,
  getKidBadgeRecords,
  getKidTransactions,
} from '@/lib/helpers'
import type { Transaction, KidBadge } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
    kidId: 'kid-1',
    type: 'earn',
    amount: 5,
    status: 'approved',
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

// ── getKidBalance ─────────────────────────────────────────────────────────────

describe('getKidBalance', () => {
  it('returns 0 when no transactions', () => {
    expect(getKidBalance('kid-1', [])).toBe(0)
  })

  it('sums approved earn transactions for the kid', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 5 }),
      makeTx({ id: 't2', amount: 3 }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(8)
  })

  it('subtracts approved redeem transactions', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 10 }),
      makeTx({ id: 't2', type: 'redeem', amount: 4, status: 'approved' }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(6)
  })

  it('ignores pending redeem transactions (points not yet deducted)', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 10 }),
      makeTx({ id: 't2', type: 'redeem', amount: 4, status: 'pending' }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(10)
  })

  it('ignores denied redeem transactions', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 10 }),
      makeTx({ id: 't2', type: 'redeem', amount: 4, status: 'denied' }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(10)
  })

  it('ignores transactions for other kids', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', kidId: 'kid-1', amount: 10 }),
      makeTx({ id: 't2', kidId: 'kid-2', amount: 99 }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(10)
  })

  it('balance can be 0 when all earned points are redeemed', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 10 }),
      makeTx({ id: 't2', type: 'redeem', amount: 10, status: 'approved' }),
    ]
    expect(getKidBalance('kid-1', txs)).toBe(0)
  })

  it('handles a mix of earn, pending redeem, and approved redeem', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', amount: 20 }),
      makeTx({ id: 't2', amount: 5 }),
      makeTx({ id: 't3', type: 'redeem', amount: 10, status: 'approved' }),
      makeTx({ id: 't4', type: 'redeem', amount: 5, status: 'pending' }),
    ]
    // 20 + 5 - 10 = 15 (pending 5 not deducted)
    expect(getKidBalance('kid-1', txs)).toBe(15)
  })
})

// ── countPendingRedemptions ───────────────────────────────────────────────────

describe('countPendingRedemptions', () => {
  it('returns 0 when no transactions', () => {
    expect(countPendingRedemptions([])).toBe(0)
  })

  it('counts pending redeem transactions across all kids', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', kidId: 'kid-1', type: 'redeem', status: 'pending' }),
      makeTx({ id: 't2', kidId: 'kid-2', type: 'redeem', status: 'pending' }),
      makeTx({ id: 't3', kidId: 'kid-1', type: 'redeem', status: 'approved' }),
    ]
    expect(countPendingRedemptions(txs)).toBe(2)
  })

  it('counts pending redeem transactions for a specific kid', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', kidId: 'kid-1', type: 'redeem', status: 'pending' }),
      makeTx({ id: 't2', kidId: 'kid-2', type: 'redeem', status: 'pending' }),
    ]
    expect(countPendingRedemptions(txs, 'kid-1')).toBe(1)
  })

  it('does not count earn transactions as pending', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', type: 'earn', status: 'pending' }),
    ]
    expect(countPendingRedemptions(txs)).toBe(0)
  })

  it('does not count denied or approved redeems', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', type: 'redeem', status: 'approved' }),
      makeTx({ id: 't2', type: 'redeem', status: 'denied' }),
    ]
    expect(countPendingRedemptions(txs)).toBe(0)
  })
})

// ── getKidBadgeRecords ────────────────────────────────────────────────────────

describe('getKidBadgeRecords', () => {
  const records: KidBadge[] = [
    { kidId: 'kid-1', badgeId: 'b1', awardedAt: '2024-01-01' },
    { kidId: 'kid-1', badgeId: 'b2', awardedAt: '2024-01-02' },
    { kidId: 'kid-2', badgeId: 'b1', awardedAt: '2024-01-03' },
  ]

  it('returns only records for the given kid', () => {
    const result = getKidBadgeRecords('kid-1', records)
    expect(result).toHaveLength(2)
    expect(result.every(r => r.kidId === 'kid-1')).toBe(true)
  })

  it('returns empty array when kid has no badges', () => {
    expect(getKidBadgeRecords('kid-99', records)).toHaveLength(0)
  })
})

// ── getKidTransactions ────────────────────────────────────────────────────────

describe('getKidTransactions', () => {
  const older = new Date(Date.now() - 10000).toISOString()
  const newer = new Date(Date.now() - 1000).toISOString()

  const txs: Transaction[] = [
    makeTx({ id: 't1', kidId: 'kid-1', timestamp: older }),
    makeTx({ id: 't2', kidId: 'kid-1', timestamp: newer }),
    makeTx({ id: 't3', kidId: 'kid-2', timestamp: newer }),
  ]

  it('returns only transactions for the given kid', () => {
    const result = getKidTransactions('kid-1', txs)
    expect(result).toHaveLength(2)
    expect(result.every(t => t.kidId === 'kid-1')).toBe(true)
  })

  it('returns transactions sorted newest first', () => {
    const result = getKidTransactions('kid-1', txs)
    expect(result[0].id).toBe('t2')
    expect(result[1].id).toBe('t1')
  })

  it('returns empty array for unknown kid', () => {
    expect(getKidTransactions('kid-99', txs)).toHaveLength(0)
  })
})
