// ── Domain entity types ───────────────────────────────────────────────────────

export type TransactionType = 'earn' | 'redeem' | 'deduct'
export type TransactionStatus = 'approved' | 'pending' | 'denied'

export interface Family {
  id: string
  /** Unique numeric-style family ID for display (e.g. "100234") */
  uid: string
  name: string
  /** Short human-readable code for joining (e.g. "SMT-4K2") */
  displayCode: string
  /** Member ID of the family owner/admin */
  ownerId: string
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
  /** Reward IDs the kid has wishlisted (max 3) */
  wishlist?: string[]
  /** Decorative frame around avatar (e.g., "stars", "crown", "rainbow") */
  avatarFrame?: string
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
  /** Points awarded (or deducted) on completion. Recommended range: 1–10 */
  pointsValue: number
  /** If true, logging this action deducts points instead of adding */
  isDeduction: boolean
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
  /** Recorded when the logged amount differs from the action's default, or for deductions */
  reason?: string
  /** Base64 data URL of an attached photo */
  photoUrl?: string
  /** Base64 data URL of an attached voice memo (max 10s) */
  voiceMemoUrl?: string
}

export interface KidBadge {
  kidId: string
  badgeId: string
  awardedAt: string
}

export type FamilyRole = 'mother' | 'father' | 'grandma' | 'grandpa' | 'aunt' | 'uncle' | 'nanny' | 'other'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface FamilyMember {
  id: string
  familyId: string
  name: string
  avatar: string
  role: FamilyRole
  gender?: Gender
  birthday?: string
  /** ISO timestamp of last birthday update (enforce once per year) */
  birthdayUpdatedAt?: string
  /** Whether this member is the family owner/admin */
  isOwner?: boolean
  createdAt: string
}

export type InviteStatus = 'pending_approval' | 'approved' | 'used'

export interface FamilyInvite {
  id: string
  familyId: string
  token: string
  role: FamilyRole
  /** Who created this invite */
  createdBy?: string
  /** Owner must approve invites created by non-owners */
  status: InviteStatus
  createdAt: string
  expiresAt: string
}

export type JoinRequestStatus = 'pending' | 'approved' | 'denied'

export interface JoinRequest {
  id: string
  familyId: string
  /** Name of the person requesting to join */
  requesterName: string
  /** Avatar chosen by requester */
  requesterAvatar: string
  /** Role they want to fill */
  requestedRole: FamilyRole
  /** Birthday (optional) */
  birthday?: string
  status: JoinRequestStatus
  createdAt: string
}

export interface ProfileChangeRequest {
  id: string
  memberId: string
  /** Partial member data to apply if approved */
  changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
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
  familyMembers: FamilyMember[]
  familyInvites: FamilyInvite[]
  joinRequests: JoinRequest[]
  profileChangeRequests: ProfileChangeRequest[]
}
