'use client'

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
import { loadStore, clearStore, DEFAULT_STORE } from '@/lib/store'
import { generateId, generateFamilyCode, generateUid } from '@/lib/ids'
import { SEED_CATEGORIES, SEED_ACTIONS } from '@/lib/seeds'
import {
  getKidBalance,
  countPendingRedemptions,
  getKidBadgeRecords,
  getKidTransactions,
  getLifetimeEarned,
} from '@/lib/helpers'
import { createClient } from '@/lib/supabase/client'
import {
  fetchFamilyData,
  migrateLocalToSupabase,
  insertFamily,
  updateFamily as dbUpdateFamily,
  insertKid,
  updateKid as dbUpdateKid,
  deleteKid as dbDeleteKid,
  insertCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  insertAction,
  updateAction as dbUpdateAction,
  insertBadge,
  updateBadge as dbUpdateBadge,
  deleteBadge as dbDeleteBadge,
  insertReward,
  updateReward as dbUpdateReward,
  deleteReward as dbDeleteReward,
  insertTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
  insertKidBadge,
  insertFamilyMember,
  updateFamilyMember as dbUpdateFamilyMember,
  deleteFamilyMember as dbDeleteFamilyMember,
  insertFamilyInvite,
  updateFamilyInvite as dbUpdateFamilyInvite,
  deleteFamilyInvite as dbDeleteFamilyInvite,
  insertJoinRequest,
  updateJoinRequest as dbUpdateJoinRequest,
  insertProfileChangeRequest,
  updateProfileChangeRequest as dbUpdateProfileChangeRequest,
} from '@/lib/supabase/database'

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
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Helper: persist to DB in background, rollback on error
  const persist = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn()
      } catch (err) {
        console.error('[sync] Failed to persist to database', err)
        // Rollback by re-fetching from Supabase
        if (userId) {
          try {
            const data = await fetchFamilyData(supabase, userId)
            dispatch({ type: 'HYDRATE', payload: data })
          } catch {
            // If re-fetch also fails, leave optimistic state as-is
          }
        }
      }
    },
    [supabase, userId],
  )

  // Hydrate from Supabase on first mount, with localStorage migration
  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        // Not authenticated — use empty defaults (middleware will redirect to login)
        setHydrated(true)
        return
      }

      setUserId(user.id)

      // Try Supabase first
      const remoteData = await fetchFamilyData(supabase, user.id)
      if (cancelled) return

      if (remoteData.family) {
        // Supabase has data — use it
        dispatch({ type: 'HYDRATE', payload: remoteData })
      } else {
        // Check localStorage for existing data to migrate
        const localData = loadStore()
        if (localData.family) {
          try {
            await migrateLocalToSupabase(supabase, user.id, localData)
            dispatch({ type: 'HYDRATE', payload: localData })
            clearStore()
          } catch (err) {
            console.error('[sync] localStorage migration failed', err)
            // Fall back to localStorage data anyway so user can still use the app
            dispatch({ type: 'HYDRATE', payload: localData })
          }
        } else {
          dispatch({ type: 'HYDRATE', payload: DEFAULT_STORE })
        }
      }

      setHydrated(true)
    }
    hydrate()
    return () => { cancelled = true }
  }, [supabase])

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

    // Persist all to Supabase
    if (userId) {
      persist(async () => {
        await insertFamily(supabase, family, userId)
        await Promise.all(categories.map(c => insertCategory(supabase, c)))
        await Promise.all(actions.map(a => insertAction(supabase, a)))
        await insertFamilyMember(supabase, owner, userId)
      })
    }
  }, [supabase, userId, persist])

  const updateFamilyName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_FAMILY_NAME', payload: name })
    if (store.family) {
      const updated = { ...store.family, name }
      persist(() => dbUpdateFamily(supabase, updated))
    }
  }, [supabase, store.family, persist])

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
      persist(() => insertKid(supabase, kid))
    },
    [store.family, supabase, persist],
  )

  const updateKidFn = useCallback((kid: Kid) => {
    dispatch({ type: 'UPDATE_KID', payload: kid })
    persist(() => dbUpdateKid(supabase, kid))
  }, [supabase, persist])

  const removeKid = useCallback((kidId: string) => {
    dispatch({ type: 'REMOVE_KID', payload: kidId })
    persist(() => dbDeleteKid(supabase, kidId))
  }, [supabase, persist])

  const addToWishlist = useCallback(
    (kidId: string, rewardId: string) => {
      const kid = store.kids.find(k => k.id === kidId)
      if (!kid) return
      const current = kid.wishlist ?? []
      if (current.includes(rewardId) || current.length >= 3) return
      const updated = { ...kid, wishlist: [...current, rewardId] }
      dispatch({ type: 'UPDATE_KID', payload: updated })
      persist(() => dbUpdateKid(supabase, updated))
    },
    [store.kids, supabase, persist],
  )

  const removeFromWishlist = useCallback(
    (kidId: string, rewardId: string) => {
      const kid = store.kids.find(k => k.id === kidId)
      if (!kid) return
      const updated = { ...kid, wishlist: (kid.wishlist ?? []).filter(id => id !== rewardId) }
      dispatch({ type: 'UPDATE_KID', payload: updated })
      persist(() => dbUpdateKid(supabase, updated))
    },
    [store.kids, supabase, persist],
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  const addAction = useCallback(
    (data: Omit<Action, 'id' | 'familyId'>) => {
      const action: Action = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_ACTION', payload: action })
      persist(() => insertAction(supabase, action))
    },
    [store.family, supabase, persist],
  )

  const updateActionFn = useCallback((action: Action) => {
    dispatch({ type: 'UPDATE_ACTION', payload: action })
    persist(() => dbUpdateAction(supabase, action))
  }, [supabase, persist])

  const archiveAction = useCallback((actionId: string) => {
    dispatch({ type: 'ARCHIVE_ACTION', payload: actionId })
    const action = store.actions.find(a => a.id === actionId)
    if (action) {
      persist(() => dbUpdateAction(supabase, { ...action, isActive: false }))
    }
  }, [store.actions, supabase, persist])

  // ── Badges ────────────────────────────────────────────────────────────────

  const addBadge = useCallback(
    (data: Omit<Badge, 'id' | 'familyId'>) => {
      const badge: Badge = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_BADGE', payload: badge })
      persist(() => insertBadge(supabase, badge))
    },
    [store.family, supabase, persist],
  )

  const updateBadgeFn = useCallback((badge: Badge) => {
    dispatch({ type: 'UPDATE_BADGE', payload: badge })
    persist(() => dbUpdateBadge(supabase, badge))
  }, [supabase, persist])

  const removeBadge = useCallback((badgeId: string) => {
    dispatch({ type: 'REMOVE_BADGE', payload: badgeId })
    persist(() => dbDeleteBadge(supabase, badgeId))
  }, [supabase, persist])

  // ── Rewards ───────────────────────────────────────────────────────────────

  const addReward = useCallback(
    (data: Omit<Reward, 'id' | 'familyId'>) => {
      const reward: Reward = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_REWARD', payload: reward })
      persist(() => insertReward(supabase, reward))
    },
    [store.family, supabase, persist],
  )

  const updateRewardFn = useCallback((reward: Reward) => {
    dispatch({ type: 'UPDATE_REWARD', payload: reward })
    persist(() => dbUpdateReward(supabase, reward))
  }, [supabase, persist])

  const removeReward = useCallback((rewardId: string) => {
    dispatch({ type: 'REMOVE_REWARD', payload: rewardId })
    persist(() => dbDeleteReward(supabase, rewardId))
  }, [supabase, persist])

  // ── Categories ────────────────────────────────────────────────────────────

  const addCategory = useCallback(
    (data: Omit<Category, 'id' | 'familyId'>) => {
      const category: Category = { ...data, id: generateId(), familyId: store.family!.id }
      dispatch({ type: 'ADD_CATEGORY', payload: category })
      persist(() => insertCategory(supabase, category))
    },
    [store.family, supabase, persist],
  )

  const updateCategoryFn = useCallback((category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category })
    persist(() => dbUpdateCategory(supabase, category))
  }, [supabase, persist])

  const removeCategory = useCallback((categoryId: string) => {
    dispatch({ type: 'REMOVE_CATEGORY', payload: categoryId })
    persist(() => dbDeleteCategory(supabase, categoryId))
  }, [supabase, persist])

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

      let badgePayload: KidBadge | null = null
      if (action.badgeId) {
        const alreadyAwarded = store.kidBadges.some(
          kb => kb.kidId === kidId && kb.badgeId === action.badgeId,
        )
        if (!alreadyAwarded) {
          badgePayload = { kidId, badgeId: action.badgeId, awardedAt: new Date().toISOString() }
          dispatch({ type: 'AWARD_BADGE', payload: badgePayload })
        }
      }

      persist(async () => {
        await insertTransaction(supabase, tx)
        if (badgePayload) {
          await insertKidBadge(supabase, badgePayload)
        }
      })
    },
    [store.actions, store.kidBadges, supabase, persist],
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
    persist(() => insertTransaction(supabase, tx))
  }, [supabase, persist])

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
    persist(() => insertTransaction(supabase, tx))
  }, [supabase, persist])

  const removeTransaction = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id })
    persist(() => dbDeleteTransaction(supabase, id))
  }, [supabase, persist])

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

      const kid = store.kids.find(k => k.id === kidId)
      const updatedKid = kid?.wishlist?.includes(rewardId)
        ? { ...kid, wishlist: kid.wishlist.filter(id => id !== rewardId) }
        : null

      if (updatedKid) {
        dispatch({ type: 'UPDATE_KID', payload: updatedKid as Kid })
      }

      persist(async () => {
        await insertTransaction(supabase, tx)
        if (updatedKid) {
          await dbUpdateKid(supabase, updatedKid as Kid)
        }
      })
    },
    [store.rewards, store.kids, supabase, persist],
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
      persist(() => insertTransaction(supabase, tx))
    },
    [store.rewards, supabase, persist],
  )

  const approveRedemption = useCallback((transactionId: string) => {
    dispatch({ type: 'APPROVE_REDEMPTION', payload: transactionId })
    persist(() => dbUpdateTransaction(supabase, { id: transactionId, status: 'approved' } as Transaction))
  }, [supabase, persist])

  const denyRedemption = useCallback((transactionId: string) => {
    dispatch({ type: 'DENY_REDEMPTION', payload: transactionId })
    persist(() => dbUpdateTransaction(supabase, { id: transactionId, status: 'denied' } as Transaction))
  }, [supabase, persist])

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
      persist(() => insertFamilyMember(supabase, member))
    },
    [store.family, supabase, persist],
  )

  const updateFamilyMemberFn = useCallback((member: FamilyMember) => {
    dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: member })
    persist(() => dbUpdateFamilyMember(supabase, member))
  }, [supabase, persist])

  const removeFamilyMember = useCallback((memberId: string) => {
    dispatch({ type: 'REMOVE_FAMILY_MEMBER', payload: memberId })
    persist(() => dbDeleteFamilyMember(supabase, memberId))
  }, [supabase, persist])

  const createFamilyInvite = useCallback(
    (role: FamilyRole): FamilyInvite => {
      const creatorIsOwner = store.family?.ownerId
        ? store.familyMembers.some(m => m.id === store.family?.ownerId && m.isOwner)
        : true
      const invite: FamilyInvite = {
        id: generateId(),
        familyId: store.family!.id,
        token: crypto.randomUUID(),
        role,
        status: creatorIsOwner ? 'approved' : 'pending_approval',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
      dispatch({ type: 'ADD_FAMILY_INVITE', payload: invite })
      persist(() => insertFamilyInvite(supabase, invite))
      return invite
    },
    [store.family, store.familyMembers, supabase, persist],
  )

  const approveInvite = useCallback((inviteId: string) => {
    const invite = store.familyInvites.find(i => i.id === inviteId)
    if (!invite) return
    const updated = { ...invite, status: 'approved' as const }
    dispatch({ type: 'UPDATE_FAMILY_INVITE', payload: updated })
    persist(() => dbUpdateFamilyInvite(supabase, updated))
  }, [store.familyInvites, supabase, persist])

  const removeFamilyInvite = useCallback((inviteId: string) => {
    dispatch({ type: 'REMOVE_FAMILY_INVITE', payload: inviteId })
    persist(() => dbDeleteFamilyInvite(supabase, inviteId))
  }, [supabase, persist])

  const transferOwnership = useCallback((newOwnerId: string) => {
    dispatch({ type: 'TRANSFER_OWNERSHIP', payload: { newOwnerId } })
    if (store.family) {
      persist(async () => {
        await dbUpdateFamily(supabase, { ...store.family!, ownerId: newOwnerId })
        // Update all members' isOwner flag
        await Promise.all(
          store.familyMembers.map(m =>
            dbUpdateFamilyMember(supabase, { ...m, isOwner: m.id === newOwnerId }),
          ),
        )
      })
    }
  }, [store.family, store.familyMembers, supabase, persist])

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
      persist(() => insertJoinRequest(supabase, request))
    },
    [store.family, supabase, persist],
  )

  const approveJoinRequest = useCallback(
    (requestId: string) => {
      const request = store.joinRequests.find(r => r.id === requestId)
      if (!request) return
      const updatedReq = { ...request, status: 'approved' as const }
      dispatch({ type: 'UPDATE_JOIN_REQUEST', payload: updatedReq })

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

      persist(async () => {
        await dbUpdateJoinRequest(supabase, updatedReq)
        await insertFamilyMember(supabase, member)
      })
    },
    [store.joinRequests, supabase, persist],
  )

  const denyJoinRequest = useCallback(
    (requestId: string) => {
      const request = store.joinRequests.find(r => r.id === requestId)
      if (!request) return
      const updated = { ...request, status: 'denied' as const }
      dispatch({ type: 'UPDATE_JOIN_REQUEST', payload: updated })
      persist(() => dbUpdateJoinRequest(supabase, updated))
    },
    [store.joinRequests, supabase, persist],
  )

  // ── Profile change requests ──────────────────────────────────────────────

  const requestProfileChange = useCallback(
    (memberId: string, changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role' | 'name'>>) => {
      const member = store.familyMembers.find(m => m.id === memberId)
      if (!member) return
      if (member.isOwner) {
        const updated = { ...member, ...changes }
        if (changes.birthday) {
          updated.birthdayUpdatedAt = new Date().toISOString()
        }
        dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: updated })
        persist(() => dbUpdateFamilyMember(supabase, updated))
        return
      }
      const request: ProfileChangeRequest = {
        id: generateId(),
        memberId,
        changes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_PROFILE_CHANGE_REQUEST', payload: request })
      persist(() => insertProfileChangeRequest(supabase, request))
    },
    [store.familyMembers, supabase, persist],
  )

  const approveProfileChange = useCallback(
    (requestId: string) => {
      const request = store.profileChangeRequests.find(r => r.id === requestId)
      if (!request) return
      const member = store.familyMembers.find(m => m.id === request.memberId)
      if (!member) return
      const updatedMember = { ...member, ...request.changes }
      if (request.changes.birthday) {
        updatedMember.birthdayUpdatedAt = new Date().toISOString()
      }
      const updatedReq = { ...request, status: 'approved' as const }
      dispatch({ type: 'UPDATE_FAMILY_MEMBER', payload: updatedMember })
      dispatch({ type: 'UPDATE_PROFILE_CHANGE_REQUEST', payload: updatedReq })
      persist(async () => {
        await dbUpdateFamilyMember(supabase, updatedMember)
        await dbUpdateProfileChangeRequest(supabase, updatedReq)
      })
    },
    [store.profileChangeRequests, store.familyMembers, supabase, persist],
  )

  const denyProfileChange = useCallback(
    (requestId: string) => {
      const request = store.profileChangeRequests.find(r => r.id === requestId)
      if (!request) return
      const updated = { ...request, status: 'denied' as const }
      dispatch({ type: 'UPDATE_PROFILE_CHANGE_REQUEST', payload: updated })
      persist(() => dbUpdateProfileChangeRequest(supabase, updated))
    },
    [store.profileChangeRequests, supabase, persist],
  )

  const isOwnerFn = useCallback(
    (memberId?: string) => {
      if (!store.family) return false
      if (memberId) return store.family.ownerId === memberId
      return store.familyMembers.some(m => m.isOwner)
    },
    [store.family, store.familyMembers],
  )

  // ── Kid badges ────────────────────────────────────────────────────────────

  const awardBadge = useCallback((kidId: string, badgeId: string) => {
    const kb: KidBadge = { kidId, badgeId, awardedAt: new Date().toISOString() }
    dispatch({ type: 'AWARD_BADGE', payload: kb })
    persist(() => insertKidBadge(supabase, kb))
  }, [supabase, persist])

  // ── Computed helpers ──────────────────────────────────────────────────────

  const getBalance = useCallback(
    (kidId: string) => getKidBalance(kidId, store.transactions),
    [store.transactions],
  )

  const getPendingCount = useCallback(
    (kidId?: string) => countPendingRedemptions(store.transactions, kidId),
    [store.transactions],
  )

  const getKidBadgesFn = useCallback(
    (kidId: string) => getKidBadgeRecords(kidId, store.kidBadges),
    [store.kidBadges],
  )

  const getTransactionsFn = useCallback(
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
    updateKid: updateKidFn,
    removeKid,
    addToWishlist,
    removeFromWishlist,
    addAction,
    updateAction: updateActionFn,
    archiveAction,
    addBadge,
    updateBadge: updateBadgeFn,
    removeBadge,
    addReward,
    updateReward: updateRewardFn,
    removeReward,
    addCategory,
    updateCategory: updateCategoryFn,
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
    updateFamilyMember: updateFamilyMemberFn,
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
    getKidBadges: getKidBadgesFn,
    getTransactions: getTransactionsFn,
    getLifetimeStars,
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>')
  return ctx
}
