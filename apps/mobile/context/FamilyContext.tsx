import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  type AppStore,
  type Family,
  type Kid,
  type Category,
  type Action,
  type Badge,
  type Reward,
  type Transaction,
  type KidBadge,
  type FamilyMember,
  type FamilyInvite,
  type FamilyRole,
  type JoinRequest,
  type ProfileChangeRequest,
  reducer,
  DEFAULT_STORE,
  generateId,
  generateUid,
  generateFamilyCode,
  SEED_CATEGORIES,
  SEED_ACTIONS,
  getKidBalance,
  countPendingRedemptions,
  getKidBadgeRecords,
  getKidTransactions,
  getLifetimeEarned,
  INVITE_EXPIRY_HOURS,
} from '@mkids/shared'
import { loadStore, saveStore } from '../lib/storage'

// ── Context value interface ───────────────────────────────────────────────────

interface FamilyContextValue {
  store: AppStore
  hydrated: boolean

  createFamily: (name: string, ownerName?: string, ownerAvatar?: string, ownerRole?: FamilyRole) => void
  updateFamilyName: (name: string) => void

  addKid: (data: Omit<Kid, 'id' | 'familyId' | 'createdAt'>) => void
  updateKid: (kid: Kid) => void
  removeKid: (kidId: string) => void
  addToWishlist: (kidId: string, rewardId: string) => void
  removeFromWishlist: (kidId: string, rewardId: string) => void

  addAction: (data: Omit<Action, 'id' | 'familyId'>) => void
  updateAction: (action: Action) => void
  archiveAction: (actionId: string) => void

  addBadge: (data: Omit<Badge, 'id' | 'familyId'>) => void
  updateBadge: (badge: Badge) => void
  removeBadge: (badgeId: string) => void

  addReward: (data: Omit<Reward, 'id' | 'familyId'>) => void
  updateReward: (reward: Reward) => void
  removeReward: (rewardId: string) => void

  addCategory: (data: Omit<Category, 'id' | 'familyId'>) => void
  updateCategory: (category: Category) => void
  removeCategory: (categoryId: string) => void

  logCompletion: (kidId: string, actionId: string, amount?: number, reason?: string, memo?: { photoUrl?: string; voiceMemoUrl?: string }) => void
  awardBonus: (kidId: string, amount: number, note: string) => void
  awardDeduction: (kidId: string, amount: number, reason?: string) => void
  redeemReward: (kidId: string, rewardId: string, costOverride?: number) => void
  requestRedemption: (kidId: string, rewardId: string) => void
  approveRedemption: (transactionId: string) => void
  denyRedemption: (transactionId: string) => void
  removeTransaction: (id: string) => void

  addFamilyMember: (data: Omit<FamilyMember, 'id' | 'familyId' | 'createdAt'>) => void
  updateFamilyMember: (member: FamilyMember) => void
  removeFamilyMember: (memberId: string) => void
  createFamilyInvite: (role: FamilyRole) => FamilyInvite
  approveInvite: (inviteId: string) => void
  removeFamilyInvite: (inviteId: string) => void
  transferOwnership: (newOwnerId: string) => void

  createJoinRequest: (data: Omit<JoinRequest, 'id' | 'familyId' | 'status' | 'createdAt'>) => void
  approveJoinRequest: (requestId: string) => void
  denyJoinRequest: (requestId: string) => void

  requestProfileChange: (memberId: string, changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>) => void
  approveProfileChange: (requestId: string) => void
  denyProfileChange: (requestId: string) => void

  isOwner: (memberId?: string) => boolean
  awardBadge: (kidId: string, badgeId: string) => void

  getBalance: (kidId: string) => number
  getPendingCount: (kidId?: string) => number
  getKidBadges: (kidId: string) => KidBadge[]
  getTransactions: (kidId: string) => Transaction[]
  getLifetimeStars: (kidId: string) => number
}

// ── Context ───────────────────────────────────────────────────────────────────

const FamilyContext = createContext<FamilyContextValue | null>(null)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, DEFAULT_STORE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadStore()
    dispatch({ type: 'HYDRATE', payload: saved })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveStore(store)
  }, [store, hydrated])

  // ── Family ──────────────────────────────────────────────────────────────────

  const createFamily = useCallback((name: string, ownerName?: string, ownerAvatar?: string, ownerRole?: FamilyRole) => {
    const familyId = generateId()
    const ownerId = generateId()
    const family: Family = {
      id: familyId,
      uid: generateUid(),
      name,
      displayCode: generateFamilyCode(),
      ownerId,
      createdAt: new Date().toISOString(),
    }
    const categories: Category[] = SEED_CATEGORIES.map(c => ({ ...c, familyId }))
    const actions: Action[] = SEED_ACTIONS.map(a => ({ ...a, id: generateId(), familyId }))
    dispatch({ type: 'CREATE_FAMILY', payload: { family, categories, actions } })
    const owner: FamilyMember = {
      id: ownerId,
      familyId,
      name: ownerName || 'Parent',
      avatar: ownerAvatar || '👤',
      role: ownerRole || 'mother',
      isOwner: true,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_FAMILY_MEMBER', payload: owner })
  }, [])

  const updateFamilyName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_FAMILY_NAME', payload: name })
  }, [])

  // ── Kids ────────────────────────────────────────────────────────────────────

  const addKid = useCallback(
    (data: Omit<Kid, 'id' | 'familyId' | 'createdAt'>) => {
      const kid: Kid = { ...data, id: generateId(), familyId: store.family!.id, createdAt: new Date().toISOString() }
      dispatch({ type: 'ADD_KID', payload: kid })
    },
    [store.family],
  )

  const updateKid = useCallback((kid: Kid) => dispatch({ type: 'UPDATE_KID', payload: kid }), [])
  const removeKid = useCallback((kidId: string) => dispatch({ type: 'REMOVE_KID', payload: kidId }), [])

  const addToWishlist = useCallback(
    (kidId: string, rewardId: string) => {
      const kid = store.kids.find(k => k.id === kidId)
      if (!kid) return
      const current = kid.wishlist ?? []
      if (current.includes(rewardId) || current.length >= 3) return
      dispatch({ type: 'UPDATE_KID', payload: { ...kid, wishlist: [...current, rewardId] } })
    },
    [store.kids],
  )

  const removeFromWishlist = useCallback(
    (kidId: string, rewardId: string) => {
      const kid = store.kids.find(k => k.id === kidId)
      if (!kid) return
      dispatch({ type: 'UPDATE_KID', payload: { ...kid, wishlist: (kid.wishlist ?? []).filter(id => id !== rewardId) } })
    },
    [store.kids],
  )

  // ── Actions ─────────────────────────────────────────────────────────────────

  const addAction = useCallback(
    (data: Omit<Action, 'id' | 'familyId'>) => {
      dispatch({ type: 'ADD_ACTION', payload: { ...data, id: generateId(), familyId: store.family!.id } })
    },
    [store.family],
  )
  const updateAction = useCallback((action: Action) => dispatch({ type: 'UPDATE_ACTION', payload: action }), [])
  const archiveAction = useCallback((actionId: string) => dispatch({ type: 'ARCHIVE_ACTION', payload: actionId }), [])

  // ── Badges ──────────────────────────────────────────────────────────────────

  const addBadge = useCallback(
    (data: Omit<Badge, 'id' | 'familyId'>) => {
      dispatch({ type: 'ADD_BADGE', payload: { ...data, id: generateId(), familyId: store.family!.id } })
    },
    [store.family],
  )
  const updateBadge = useCallback((badge: Badge) => dispatch({ type: 'UPDATE_BADGE', payload: badge }), [])
  const removeBadge = useCallback((badgeId: string) => dispatch({ type: 'REMOVE_BADGE', payload: badgeId }), [])

  // ── Rewards ─────────────────────────────────────────────────────────────────

  const addReward = useCallback(
    (data: Omit<Reward, 'id' | 'familyId'>) => {
      dispatch({ type: 'ADD_REWARD', payload: { ...data, id: generateId(), familyId: store.family!.id } })
    },
    [store.family],
  )
  const updateReward = useCallback((reward: Reward) => dispatch({ type: 'UPDATE_REWARD', payload: reward }), [])
  const removeReward = useCallback((rewardId: string) => dispatch({ type: 'REMOVE_REWARD', payload: rewardId }), [])

  // ── Categories ──────────────────────────────────────────────────────────────

  const addCategory = useCallback(
    (data: Omit<Category, 'id' | 'familyId'>) => {
      dispatch({ type: 'ADD_CATEGORY', payload: { ...data, id: generateId(), familyId: store.family!.id } })
    },
    [store.family],
  )
  const updateCategory = useCallback((category: Category) => dispatch({ type: 'UPDATE_CATEGORY', payload: category }), [])
  const removeCategory = useCallback((categoryId: string) => dispatch({ type: 'REMOVE_CATEGORY', payload: categoryId }), [])

  // ── Transactions ────────────────────────────────────────────────────────────

  const logCompletion = useCallback(
    (kidId: string, actionId: string, amount?: number, reason?: string, memo?: { photoUrl?: string; voiceMemoUrl?: string }) => {
      const action = store.actions.find(a => a.id === actionId)
      if (!action) return
      const tx: Transaction = {
        id: generateId(), kidId, type: action.isDeduction ? 'deduct' : 'earn',
        amount: amount ?? action.pointsValue, actionId, status: 'approved',
        timestamp: new Date().toISOString(), reason, photoUrl: memo?.photoUrl, voiceMemoUrl: memo?.voiceMemoUrl,
      }
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })
      if (action.badgeId) {
        const alreadyAwarded = store.kidBadges.some(kb => kb.kidId === kidId && kb.badgeId === action.badgeId)
        if (!alreadyAwarded) {
          dispatch({ type: 'AWARD_BADGE', payload: { kidId, badgeId: action.badgeId, awardedAt: new Date().toISOString() } })
        }
      }
    },
    [store.actions, store.kidBadges],
  )

  const awardBonus = useCallback((kidId: string, amount: number, note: string) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateId(), kidId, type: 'earn', amount, status: 'approved', timestamp: new Date().toISOString(), note } })
  }, [])

  const awardDeduction = useCallback((kidId: string, amount: number, reason?: string) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateId(), kidId, type: 'deduct', amount, status: 'approved', timestamp: new Date().toISOString(), reason } })
  }, [])

  const removeTransaction = useCallback((id: string) => dispatch({ type: 'REMOVE_TRANSACTION', payload: id }), [])

  const redeemReward = useCallback(
    (kidId: string, rewardId: string, costOverride?: number) => {
      const reward = store.rewards.find(r => r.id === rewardId)
      if (!reward) return
      dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateId(), kidId, type: 'redeem', amount: costOverride ?? reward.pointsCost, rewardId, status: 'approved', timestamp: new Date().toISOString() } })
      const kid = store.kids.find(k => k.id === kidId)
      if (kid?.wishlist?.includes(rewardId)) {
        dispatch({ type: 'UPDATE_KID', payload: { ...kid, wishlist: kid.wishlist.filter(id => id !== rewardId) } })
      }
    },
    [store.rewards, store.kids],
  )

  const requestRedemption = useCallback(
    (kidId: string, rewardId: string) => {
      const reward = store.rewards.find(r => r.id === rewardId)
      if (!reward) return
      dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateId(), kidId, type: 'redeem', amount: reward.pointsCost, rewardId, status: 'pending', timestamp: new Date().toISOString() } })
    },
    [store.rewards],
  )

  const approveRedemption = useCallback((txId: string) => dispatch({ type: 'APPROVE_REDEMPTION', payload: txId }), [])
  const denyRedemption = useCallback((txId: string) => dispatch({ type: 'DENY_REDEMPTION', payload: txId }), [])

  // ── Family members ──────────────────────────────────────────────────────────

  const addFamilyMember = useCallback(
    (data: Omit<FamilyMember, 'id' | 'familyId' | 'createdAt'>) => {
      dispatch({ type: 'ADD_FAMILY_MEMBER', payload: { ...data, id: generateId(), familyId: store.family!.id, createdAt: new Date().toISOString() } })
    },
    [store.family],
  )
  const updateFamilyMember = useCallback((m: FamilyMember) => dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: m }), [])
  const removeFamilyMember = useCallback((id: string) => dispatch({ type: 'REMOVE_FAMILY_MEMBER', payload: id }), [])

  const createFamilyInvite = useCallback(
    (role: FamilyRole): FamilyInvite => {
      const creatorIsOwner = store.family?.ownerId
        ? store.familyMembers.some(m => m.id === store.family?.ownerId && m.isOwner)
        : true
      const invite: FamilyInvite = {
        id: generateId(), familyId: store.family!.id,
        token: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10),
        role, status: creatorIsOwner ? 'approved' : 'pending_approval',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      }
      dispatch({ type: 'ADD_FAMILY_INVITE', payload: invite })
      return invite
    },
    [store.family, store.familyMembers],
  )

  const approveInvite = useCallback((inviteId: string) => {
    const invite = store.familyInvites.find(i => i.id === inviteId)
    if (!invite) return
    dispatch({ type: 'UPDATE_FAMILY_INVITE', payload: { ...invite, status: 'approved' } })
  }, [store.familyInvites])

  const removeFamilyInvite = useCallback((id: string) => dispatch({ type: 'REMOVE_FAMILY_INVITE', payload: id }), [])
  const transferOwnership = useCallback((newOwnerId: string) => dispatch({ type: 'TRANSFER_OWNERSHIP', payload: { newOwnerId } }), [])

  // ── Join requests ───────────────────────────────────────────────────────────

  const createJoinRequest = useCallback(
    (data: Omit<JoinRequest, 'id' | 'familyId' | 'status' | 'createdAt'>) => {
      dispatch({ type: 'ADD_JOIN_REQUEST', payload: { ...data, id: generateId(), familyId: store.family!.id, status: 'pending', createdAt: new Date().toISOString() } })
    },
    [store.family],
  )

  const approveJoinRequest = useCallback(
    (requestId: string) => {
      const request = store.joinRequests.find(r => r.id === requestId)
      if (!request) return
      dispatch({ type: 'UPDATE_JOIN_REQUEST', payload: { ...request, status: 'approved' } })
      dispatch({ type: 'ADD_FAMILY_MEMBER', payload: { id: generateId(), familyId: request.familyId, name: request.requesterName, avatar: request.requesterAvatar, role: request.requestedRole, birthday: request.birthday, createdAt: new Date().toISOString() } })
    },
    [store.joinRequests],
  )

  const denyJoinRequest = useCallback(
    (requestId: string) => {
      const request = store.joinRequests.find(r => r.id === requestId)
      if (!request) return
      dispatch({ type: 'UPDATE_JOIN_REQUEST', payload: { ...request, status: 'denied' } })
    },
    [store.joinRequests],
  )

  // ── Profile change requests ─────────────────────────────────────────────────

  const requestProfileChange = useCallback(
    (memberId: string, changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>) => {
      const member = store.familyMembers.find(m => m.id === memberId)
      if (!member) return
      if (member.isOwner) {
        const updated = { ...member, ...changes }
        if (changes.birthday) updated.birthdayUpdatedAt = new Date().toISOString()
        dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: updated })
        return
      }
      dispatch({ type: 'ADD_PROFILE_CHANGE_REQUEST', payload: { id: generateId(), memberId, changes, status: 'pending', createdAt: new Date().toISOString() } })
    },
    [store.familyMembers],
  )

  const approveProfileChange = useCallback(
    (requestId: string) => {
      const request = store.profileChangeRequests.find(r => r.id === requestId)
      if (!request) return
      const member = store.familyMembers.find(m => m.id === request.memberId)
      if (!member) return
      const updated = { ...member, ...request.changes }
      if (request.changes.birthday) updated.birthdayUpdatedAt = new Date().toISOString()
      dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: updated })
      dispatch({ type: 'UPDATE_PROFILE_CHANGE_REQUEST', payload: { ...request, status: 'approved' } })
    },
    [store.profileChangeRequests, store.familyMembers],
  )

  const denyProfileChange = useCallback(
    (requestId: string) => {
      const request = store.profileChangeRequests.find(r => r.id === requestId)
      if (!request) return
      dispatch({ type: 'UPDATE_PROFILE_CHANGE_REQUEST', payload: { ...request, status: 'denied' } })
    },
    [store.profileChangeRequests],
  )

  const isOwnerFn = useCallback(
    (memberId?: string) => {
      if (!store.family) return false
      if (memberId) return store.family.ownerId === memberId
      return store.familyMembers.some(m => m.isOwner)
    },
    [store.family, store.familyMembers],
  )

  const awardBadge = useCallback((kidId: string, badgeId: string) => {
    dispatch({ type: 'AWARD_BADGE', payload: { kidId, badgeId, awardedAt: new Date().toISOString() } })
  }, [])

  const getBalance = useCallback((kidId: string) => getKidBalance(kidId, store.transactions), [store.transactions])
  const getPendingCount = useCallback((kidId?: string) => countPendingRedemptions(store.transactions, kidId), [store.transactions])
  const getKidBadgesFn = useCallback((kidId: string) => getKidBadgeRecords(kidId, store.kidBadges), [store.kidBadges])
  const getTransactionsFn = useCallback((kidId: string) => getKidTransactions(kidId, store.transactions), [store.transactions])
  const getLifetimeStarsFn = useCallback((kidId: string) => getLifetimeEarned(kidId, store.transactions), [store.transactions])

  const value: FamilyContextValue = {
    store, hydrated,
    createFamily, updateFamilyName,
    addKid, updateKid, removeKid, addToWishlist, removeFromWishlist,
    addAction, updateAction, archiveAction,
    addBadge, updateBadge, removeBadge,
    addReward, updateReward, removeReward,
    addCategory, updateCategory, removeCategory,
    logCompletion, awardBonus, awardDeduction, redeemReward, requestRedemption, approveRedemption, denyRedemption, removeTransaction,
    addFamilyMember, updateFamilyMember, removeFamilyMember, createFamilyInvite, approveInvite, removeFamilyInvite, transferOwnership,
    createJoinRequest, approveJoinRequest, denyJoinRequest,
    requestProfileChange, approveProfileChange, denyProfileChange,
    isOwner: isOwnerFn, awardBadge,
    getBalance, getPendingCount, getKidBadges: getKidBadgesFn, getTransactions: getTransactionsFn, getLifetimeStars: getLifetimeStarsFn,
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>')
  return ctx
}
