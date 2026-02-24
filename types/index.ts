// ── Domain entity types ───────────────────────────────────────────────────────

export type TransactionType = 'earn' | 'redeem'
export type TransactionStatus = 'approved' | 'pending' | 'denied'

export interface Family {
  id: string
  name: string
  createdAt: string
}

export interface Kid {
  id: string
  familyId: string
  name: string
  /** Emoji character used as avatar */
  avatar: string
  /** Hex color used as the kid's accent color */
  colorAccent: string
  createdAt: string
}

export interface Category {
  id: string
  familyId: string
  name: string
  /** Emoji icon */
  icon: string
}

export interface Action {
  id: string
  familyId: string
  name: string
  description: string
  categoryId: string
  /** Points awarded on completion. Recommended range: 1–10 */
  pointsValue: number
  /** Optional badge automatically awarded on completion */
  badgeId?: string
  isTemplate: boolean
  isActive: boolean
}

export interface Badge {
  id: string
  familyId: string
  name: string
  /** Emoji icon */
  icon: string
  description: string
}

export interface Reward {
  id: string
  familyId: string
  name: string
  description: string
  pointsCost: number
  isActive: boolean
}

export interface Transaction {
  id: string
  kidId: string
  type: TransactionType
  amount: number
  actionId?: string
  rewardId?: string
  status: TransactionStatus
  timestamp: string
  note?: string
}

export interface KidBadge {
  kidId: string
  badgeId: string
  awardedAt: string
}

// ── Persisted store shape ─────────────────────────────────────────────────────

export interface AppStore {
  family: Family | null
  kids: Kid[]
  categories: Category[]
  actions: Action[]
  badges: Badge[]
  rewards: Reward[]
  transactions: Transaction[]
  kidBadges: KidBadge[]
}
