'use client'

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  AppStore,
  Family,
  Kid,
  Category,
  Action,
  Badge,
  Reward,
  Transaction,
  KidBadge,
  FamilyMember,
  FamilyInvite,
  FamilyRole,
  JoinRequest,
  ProfileChangeRequest,
  Gender,
} from '@/types'
import { loadStore, saveStore, DEFAULT_STORE } from '@/lib/store'
import { generateId, generateFamilyCode, generateUid } from '@/lib/ids'
import { SEED_CATEGORIES, SEED_ACTIONS } from '@/lib/seeds'
import {
  getKidBalance,
  countPendingRedemptions,
  getKidBadgeRecords,
  getKidTransactions,
  getLifetimeEarned,
} from '@/lib/helpers'

// ── Reducer action types ──────────────────────────────────────────────────────

type StoreAction =
  | { type: 'HYDRATE'; payload: AppStore }
  | { type: 'CREATE_FAMILY'; payload: { family: Family; categories: Category[]; actions: Action[] } }
  | { type: 'UPDATE_FAMILY_NAME'; payload: string }
  | { type: 'ADD_KID'; payload: Kid }
  | { type: 'UPDATE_KID'; payload: Kid }
  | { type: 'REMOVE_KID'; payload: string }
  | { type: 'ADD_ACTION'; payload: Action }
  | { type: 'UPDATE_ACTION'; payload: Action }
  | { type: 'ARCHIVE_ACTION'; payload: string }
  | { type: 'ADD_BADGE'; payload: Badge }
  | { type: 'UPDATE_BADGE'; payload: Badge }
  | { type: 'REMOVE_BADGE'; payload: string }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'REMOVE_REWARD'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'APPROVE_REDEMPTION'; payload: string }
  | { type: 'DENY_REDEMPTION'; payload: string }
  | { type: 'AWARD_BADGE'; payload: KidBadge }
  | { type: 'ADD_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'UPDATE_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'REMOVE_FAMILY_MEMBER'; payload: string }
  | { type: 'ADD_FAMILY_INVITE'; payload: FamilyInvite }
  | { type: 'UPDATE_FAMILY_INVITE'; payload: FamilyInvite }
  | { type: 'REMOVE_FAMILY_INVITE'; payload: string }
  | { type: 'ADD_JOIN_REQUEST'; payload: JoinRequest }
  | { type: 'UPDATE_JOIN_REQUEST'; payload: JoinRequest }
  | { type: 'REMOVE_JOIN_REQUEST'; payload: string }
  | { type: 'UPDATE_FAMILY'; payload: Family }
  | { type: 'TRANSFER_OWNERSHIP'; payload: { newOwnerId: string } }
  | { type: 'ADD_PROFILE_CHANGE_REQUEST'; payload: ProfileChangeRequest }
  | { type: 'UPDATE_PROFILE_CHANGE_REQUEST'; payload: ProfileChangeRequest }
  | { type: 'REMOVE_PROFILE_CHANGE_REQUEST'; payload: string }

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppStore, action: StoreAction): AppStore {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload

    case 'CREATE_FAMILY':
      return {
        ...state,
        family: action.payload.family,
        categories: action.payload.categories,
        actions: action.payload.actions,
      }

    case 'UPDATE_FAMILY_NAME':
      return state.family
        ? { ...state, family: { ...state.family, name: action.payload } }
        : state

    case 'ADD_KID':
      return { ...state, kids: [...state.kids, action.payload] }

    case 'UPDATE_KID':
      return {
        ...state,
        kids: state.kids.map(k => (k.id === action.payload.id ? action.payload : k)),
      }

    case 'REMOVE_KID':
      return { ...state, kids: state.kids.filter(k => k.id !== action.payload) }

    case 'ADD_ACTION':
      return { ...state, actions: [...state.actions, action.payload] }

    case 'UPDATE_ACTION':
      return {
        ...state,
        actions: state.actions.map(a => (a.id === action.payload.id ? action.payload : a)),
      }

    case 'ARCHIVE_ACTION':
      return {
        ...state,
        actions: state.actions.map(a =>
          a.id === action.payload ? { ...a, isActive: false } : a,
        ),
      }

    case 'ADD_BADGE':
      return { ...state, badges: [...state.badges, action.payload] }

    case 'UPDATE_BADGE':
      return {
        ...state,
        badges: state.badges.map(b => (b.id === action.payload.id ? action.payload : b)),
      }

    case 'REMOVE_BADGE':
      return { ...state, badges: state.badges.filter(b => b.id !== action.payload) }

    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] }

    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map(r => (r.id === action.payload.id ? action.payload : r)),
      }

    case 'REMOVE_REWARD':
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) }

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c,
        ),
      }

    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      }

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }

    case 'REMOVE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }

    case 'APPROVE_REDEMPTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload ? { ...t, status: 'approved' } : t,
        ),
      }

    case 'DENY_REDEMPTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload ? { ...t, status: 'denied' } : t,
        ),
      }

    case 'AWARD_BADGE':
      return { ...state, kidBadges: [...state.kidBadges, action.payload] }

    case 'ADD_FAMILY_MEMBER':
      return { ...state, familyMembers: [...state.familyMembers, action.payload] }

    case 'UPDATE_FAMILY_MEMBER':
      return {
        ...state,
        familyMembers: state.familyMembers.map(m =>
          m.id === action.payload.id ? action.payload : m,
        ),
      }

    case 'REMOVE_FAMILY_MEMBER':
      return { ...state, familyMembers: state.familyMembers.filter(m => m.id !== action.payload) }

    case 'ADD_FAMILY_INVITE':
      return { ...state, familyInvites: [...state.familyInvites, action.payload] }

    case 'UPDATE_FAMILY_INVITE':
      return {
        ...state,
        familyInvites: state.familyInvites.map(i =>
          i.id === action.payload.id ? action.payload : i,
        ),
      }

    case 'REMOVE_FAMILY_INVITE':
      return { ...state, familyInvites: state.familyInvites.filter(i => i.id !== action.payload) }

    case 'ADD_JOIN_REQUEST':
      return { ...state, joinRequests: [...state.joinRequests, action.payload] }

    case 'UPDATE_JOIN_REQUEST':
      return {
        ...state,
        joinRequests: state.joinRequests.map(r =>
          r.id === action.payload.id ? action.payload : r,
        ),
      }

    case 'REMOVE_JOIN_REQUEST':
      return { ...state, joinRequests: state.joinRequests.filter(r => r.id !== action.payload) }

    case 'UPDATE_FAMILY':
      return { ...state, family: action.payload }

    case 'TRANSFER_OWNERSHIP': {
      const newOwnerId = action.payload.newOwnerId
      return {
        ...state,
        family: state.family ? { ...state.family, ownerId: newOwnerId } : state.family,
        familyMembers: state.familyMembers.map(m => ({
          ...m,
          isOwner: m.id === newOwnerId,
        })),
      }
    }

    case 'ADD_PROFILE_CHANGE_REQUEST':
      return { ...state, profileChangeRequests: [...state.profileChangeRequests, action.payload] }

    case 'UPDATE_PROFILE_CHANGE_REQUEST':
      return {
        ...state,
        profileChangeRequests: state.profileChangeRequests.map(r =>
          r.id === action.payload.id ? action.payload : r,
        ),
      }

    case 'REMOVE_PROFILE_CHANGE_REQUEST':
      return { ...state, profileChangeRequests: state.profileChangeRequests.filter(r => r.id !== action.payload) }

    default:
      return state
  }
}

// ── Context value interface ───────────────────────────────────────────────────

interface FamilyContextValue {
  store: AppStore
  hydrated: boolean

  // Family
  createFamily: (name: string, ownerName?: string, ownerAvatar?: string, ownerRole?: FamilyRole) => void
  updateFamilyName: (name: string) => void

  // Kids
  addKid: (data: Omit<Kid, 'id' | 'familyId' | 'createdAt'>) => void
  updateKid: (kid: Kid) => void
  removeKid: (kidId: string) => void
  addToWishlist: (kidId: string, rewardId: string) => void
  removeFromWishlist: (kidId: string, rewardId: string) => void

  // Actions
  addAction: (data: Omit<Action, 'id' | 'familyId'>) => void
  updateAction: (action: Action) => void
  archiveAction: (actionId: string) => void

  // Badges
  addBadge: (data: Omit<Badge, 'id' | 'familyId'>) => void
  updateBadge: (badge: Badge) => void
  removeBadge: (badgeId: string) => void

  // Rewards
  addReward: (data: Omit<Reward, 'id' | 'familyId'>) => void
  updateReward: (reward: Reward) => void
  removeReward: (rewardId: string) => void

  // Categories
  addCategory: (data: Omit<Category, 'id' | 'familyId'>) => void
  updateCategory: (category: Category) => void
  removeCategory: (categoryId: string) => void

  // Transactions
  logCompletion: (kidId: string, actionId: string, amount?: number, reason?: string, memo?: { photoUrl?: string; voiceMemoUrl?: string }) => void
  awardBonus: (kidId: string, amount: number, note: string) => void
  awardDeduction: (kidId: string, amount: number, reason?: string) => void
  redeemReward: (kidId: string, rewardId: string, costOverride?: number) => void
  requestRedemption: (kidId: string, rewardId: string) => void
  approveRedemption: (transactionId: string) => void
  denyRedemption: (transactionId: string) => void
  removeTransaction: (id: string) => void

  // Family members
  addFamilyMember: (data: Omit<FamilyMember, 'id' | 'familyId' | 'createdAt'>) => void
  updateFamilyMember: (member: FamilyMember) => void
  removeFamilyMember: (memberId: string) => void
  createFamilyInvite: (role: FamilyRole) => FamilyInvite
  approveInvite: (inviteId: string) => void
  removeFamilyInvite: (inviteId: string) => void
  transferOwnership: (newOwnerId: string) => void

  // Join requests
  createJoinRequest: (data: Omit<JoinRequest, 'id' | 'familyId' | 'status' | 'createdAt'>) => void
  approveJoinRequest: (requestId: string) => void
  denyJoinRequest: (requestId: string) => void

  // Profile change requests
  requestProfileChange: (memberId: string, changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>) => void
  approveProfileChange: (requestId: string) => void
  denyProfileChange: (requestId: string) => void

  // Helpers
  isOwner: (memberId?: string) => boolean

  // Kid badges
  awardBadge: (kidId: string, badgeId: string) => void

  // Computed helpers
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

  // Hydrate from localStorage on first mount
  useEffect(() => {
    const saved = loadStore()
    dispatch({ type: 'HYDRATE', payload: saved })
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever store changes — only after hydration
  // so that the initial DEFAULT_STORE render doesn't overwrite seeded data.
  useEffect(() => {
    if (!hydrated) return
    saveStore(store)
  }, [store, hydrated])

  // ── Family ────────────────────────────────────────────────────────────────

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
    const actions: Action[] = SEED_ACTIONS.map(a => ({
      ...a,
      id: generateId(),
      familyId,
    }))
    dispatch({ type: 'CREATE_FAMILY', payload: { family, categories, actions } })
    // Auto-create the owner as first family member
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

  // ── Kids ──────────────────────────────────────────────────────────────────

  const addKid = useCallback(
    (data: Omit<Kid, 'id' | 'familyId' | 'createdAt'>) => {
      const kid: Kid = {
        ...data,
        id: generateId(),
        familyId: store.family!.id,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_KID', payload: kid })
    },
    [store.family],
  )

  const updateKid = useCallback((kid: Kid) => {
    dispatch({ type: 'UPDATE_KID', payload: kid })
  }, [])

  const removeKid = useCallback((kidId: string) => {
    dispatch({ type: 'REMOVE_KID', payload: kidId })
  }, [])

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

  // ── Actions ───────────────────────────────────────────────────────────────

  const addAction = useCallback(
    (data: Omit<Action, 'id' | 'familyId'>) => {
      const action: Action = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_ACTION', payload: action })
    },
    [store.family],
  )

  const updateAction = useCallback((action: Action) => {
    dispatch({ type: 'UPDATE_ACTION', payload: action })
  }, [])

  const archiveAction = useCallback((actionId: string) => {
    dispatch({ type: 'ARCHIVE_ACTION', payload: actionId })
  }, [])

  // ── Badges ────────────────────────────────────────────────────────────────

  const addBadge = useCallback(
    (data: Omit<Badge, 'id' | 'familyId'>) => {
      const badge: Badge = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_BADGE', payload: badge })
    },
    [store.family],
  )

  const updateBadge = useCallback((badge: Badge) => {
    dispatch({ type: 'UPDATE_BADGE', payload: badge })
  }, [])

  const removeBadge = useCallback((badgeId: string) => {
    dispatch({ type: 'REMOVE_BADGE', payload: badgeId })
  }, [])

  // ── Rewards ───────────────────────────────────────────────────────────────

  const addReward = useCallback(
    (data: Omit<Reward, 'id' | 'familyId'>) => {
      const reward: Reward = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_REWARD', payload: reward })
    },
    [store.family],
  )

  const updateReward = useCallback((reward: Reward) => {
    dispatch({ type: 'UPDATE_REWARD', payload: reward })
  }, [])

  const removeReward = useCallback((rewardId: string) => {
    dispatch({ type: 'REMOVE_REWARD', payload: rewardId })
  }, [])

  // ── Categories ────────────────────────────────────────────────────────────

  const addCategory = useCallback(
    (data: Omit<Category, 'id' | 'familyId'>) => {
      const category: Category = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_CATEGORY', payload: category })
    },
    [store.family],
  )

  const updateCategory = useCallback((category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category })
  }, [])

  const removeCategory = useCallback((categoryId: string) => {
    dispatch({ type: 'REMOVE_CATEGORY', payload: categoryId })
  }, [])

  // ── Transactions ──────────────────────────────────────────────────────────

  const logCompletion = useCallback(
    (kidId: string, actionId: string, amount?: number, reason?: string, memo?: { photoUrl?: string; voiceMemoUrl?: string }) => {
      const action = store.actions.find(a => a.id === actionId)
      if (!action) return
      const finalAmount = amount ?? action.pointsValue
      const tx: Transaction = {
        id: generateId(),
        kidId,
        type: action.isDeduction ? 'deduct' : 'earn',
        amount: finalAmount,
        actionId,
        status: 'approved',
        timestamp: new Date().toISOString(),
        reason,
        photoUrl: memo?.photoUrl,
        voiceMemoUrl: memo?.voiceMemoUrl,
      }
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })

      // Auto-award linked badge if not already awarded
      if (action.badgeId) {
        const alreadyAwarded = store.kidBadges.some(
          kb => kb.kidId === kidId && kb.badgeId === action.badgeId,
        )
        if (!alreadyAwarded) {
          dispatch({
            type: 'AWARD_BADGE',
            payload: { kidId, badgeId: action.badgeId, awardedAt: new Date().toISOString() },
          })
        }
      }
    },
    [store.actions, store.kidBadges],
  )

  const awardBonus = useCallback((kidId: string, amount: number, note: string) => {
    const tx: Transaction = {
      id: generateId(),
      kidId,
      type: 'earn',
      amount,
      status: 'approved',
      timestamp: new Date().toISOString(),
      note,
    }
    dispatch({ type: 'ADD_TRANSACTION', payload: tx })
  }, [])

  const awardDeduction = useCallback((kidId: string, amount: number, reason?: string) => {
    const tx: Transaction = {
      id: generateId(),
      kidId,
      type: 'deduct',
      amount,
      status: 'approved',
      timestamp: new Date().toISOString(),
      reason,
    }
    dispatch({ type: 'ADD_TRANSACTION', payload: tx })
  }, [])

  const removeTransaction = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id })
  }, [])

  const redeemReward = useCallback(
    (kidId: string, rewardId: string, costOverride?: number) => {
      const reward = store.rewards.find(r => r.id === rewardId)
      if (!reward) return
      const tx: Transaction = {
        id: generateId(),
        kidId,
        type: 'redeem',
        amount: costOverride ?? reward.pointsCost,
        rewardId,
        status: 'approved',
        timestamp: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })
      // Auto-remove redeemed reward from the kid's wishlist
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
      const tx: Transaction = {
        id: generateId(),
        kidId,
        type: 'redeem',
        amount: reward.pointsCost,
        rewardId,
        status: 'pending',
        timestamp: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })
    },
    [store.rewards],
  )

  const approveRedemption = useCallback((transactionId: string) => {
    dispatch({ type: 'APPROVE_REDEMPTION', payload: transactionId })
  }, [])

  const denyRedemption = useCallback((transactionId: string) => {
    dispatch({ type: 'DENY_REDEMPTION', payload: transactionId })
  }, [])

  // ── Family members ───────────────────────────────────────────────────────

  const addFamilyMember = useCallback(
    (data: Omit<FamilyMember, 'id' | 'familyId' | 'createdAt'>) => {
      const member: FamilyMember = {
        ...data,
        id: generateId(),
        familyId: store.family!.id,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_FAMILY_MEMBER', payload: member })
    },
    [store.family],
  )

  const updateFamilyMember = useCallback((member: FamilyMember) => {
    dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: member })
  }, [])

  const removeFamilyMember = useCallback((memberId: string) => {
    dispatch({ type: 'REMOVE_FAMILY_MEMBER', payload: memberId })
  }, [])

  const createFamilyInvite = useCallback(
    (role: FamilyRole): FamilyInvite => {
      // If creator is the owner, auto-approve; otherwise pending
      const creatorIsOwner = store.family?.ownerId
        ? store.familyMembers.some(m => m.id === store.family?.ownerId && m.isOwner)
        : true // fallback: first member is owner
      const invite: FamilyInvite = {
        id: generateId(),
        familyId: store.family!.id,
        token: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10),
        role,
        status: creatorIsOwner ? 'approved' : 'pending_approval',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

  const removeFamilyInvite = useCallback((inviteId: string) => {
    dispatch({ type: 'REMOVE_FAMILY_INVITE', payload: inviteId })
  }, [])

  const transferOwnership = useCallback((newOwnerId: string) => {
    dispatch({ type: 'TRANSFER_OWNERSHIP', payload: { newOwnerId } })
  }, [])

  // ── Join requests ───────────────────────────────────────────────────────

  const createJoinRequest = useCallback(
    (data: Omit<JoinRequest, 'id' | 'familyId' | 'status' | 'createdAt'>) => {
      const request: JoinRequest = {
        ...data,
        id: generateId(),
        familyId: store.family!.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_JOIN_REQUEST', payload: request })
    },
    [store.family],
  )

  const approveJoinRequest = useCallback(
    (requestId: string) => {
      const request = store.joinRequests.find(r => r.id === requestId)
      if (!request) return
      // Mark as approved
      dispatch({ type: 'UPDATE_JOIN_REQUEST', payload: { ...request, status: 'approved' } })
      // Auto-create family member from the request
      const member: FamilyMember = {
        id: generateId(),
        familyId: request.familyId,
        name: request.requesterName,
        avatar: request.requesterAvatar,
        role: request.requestedRole,
        birthday: request.birthday,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_FAMILY_MEMBER', payload: member })
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

  // ── Profile change requests ──────────────────────────────────────────────

  const requestProfileChange = useCallback(
    (memberId: string, changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>) => {
      const member = store.familyMembers.find(m => m.id === memberId)
      if (!member) return
      // If this member is the owner, apply directly (no approval needed)
      if (member.isOwner) {
        const updated = { ...member, ...changes }
        if (changes.birthday) {
          updated.birthdayUpdatedAt = new Date().toISOString()
        }
        dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: updated })
        return
      }
      // Non-owner: create a pending request
      const request: ProfileChangeRequest = {
        id: generateId(),
        memberId,
        changes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_PROFILE_CHANGE_REQUEST', payload: request })
    },
    [store.familyMembers],
  )

  const approveProfileChange = useCallback(
    (requestId: string) => {
      const request = store.profileChangeRequests.find(r => r.id === requestId)
      if (!request) return
      const member = store.familyMembers.find(m => m.id === request.memberId)
      if (!member) return
      // Apply changes
      const updated = { ...member, ...request.changes }
      if (request.changes.birthday) {
        updated.birthdayUpdatedAt = new Date().toISOString()
      }
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
      // Check if any member is owner (for UI guards)
      return store.familyMembers.some(m => m.isOwner)
    },
    [store.family, store.familyMembers],
  )

  // ── Kid badges ────────────────────────────────────────────────────────────

  const awardBadge = useCallback((kidId: string, badgeId: string) => {
    dispatch({
      type: 'AWARD_BADGE',
      payload: { kidId, badgeId, awardedAt: new Date().toISOString() },
    })
  }, [])

  // ── Computed helpers ──────────────────────────────────────────────────────

  const getBalance = useCallback(
    (kidId: string) => getKidBalance(kidId, store.transactions),
    [store.transactions],
  )

  const getPendingCount = useCallback(
    (kidId?: string) => countPendingRedemptions(store.transactions, kidId),
    [store.transactions],
  )

  const getKidBadges = useCallback(
    (kidId: string) => getKidBadgeRecords(kidId, store.kidBadges),
    [store.kidBadges],
  )

  const getTransactions = useCallback(
    (kidId: string) => getKidTransactions(kidId, store.transactions),
    [store.transactions],
  )

  const getLifetimeStars = useCallback(
    (kidId: string) => getLifetimeEarned(kidId, store.transactions),
    [store.transactions],
  )

  const value: FamilyContextValue = {
    store,
    hydrated,
    createFamily,
    updateFamilyName,
    addKid,
    updateKid,
    removeKid,
    addToWishlist,
    removeFromWishlist,
    addAction,
    updateAction,
    archiveAction,
    addBadge,
    updateBadge,
    removeBadge,
    addReward,
    updateReward,
    removeReward,
    addCategory,
    updateCategory,
    removeCategory,
    logCompletion,
    awardBonus,
    awardDeduction,
    redeemReward,
    requestRedemption,
    approveRedemption,
    denyRedemption,
    removeTransaction,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    createFamilyInvite,
    approveInvite,
    removeFamilyInvite,
    transferOwnership,
    createJoinRequest,
    approveJoinRequest,
    denyJoinRequest,
    requestProfileChange,
    approveProfileChange,
    denyProfileChange,
    isOwner: isOwnerFn,
    awardBadge,
    getBalance,
    getPendingCount,
    getKidBadges,
    getTransactions,
    getLifetimeStars,
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>')
  return ctx
}
