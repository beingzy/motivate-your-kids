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
} from '@/types'
import { loadStore, saveStore, DEFAULT_STORE } from '@/lib/store'
import { generateId } from '@/lib/ids'
import { SEED_CATEGORIES, SEED_ACTIONS } from '@/lib/seeds'
import {
  getKidBalance,
  countPendingRedemptions,
  getKidBadgeRecords,
  getKidTransactions,
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

    default:
      return state
  }
}

// ── Context value interface ───────────────────────────────────────────────────

interface FamilyContextValue {
  store: AppStore
  hydrated: boolean

  // Family
  createFamily: (name: string) => void
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
  logCompletion: (kidId: string, actionId: string, amount?: number, reason?: string) => void
  awardBonus: (kidId: string, amount: number, note: string) => void
  awardDeduction: (kidId: string, amount: number, reason?: string) => void
  redeemReward: (kidId: string, rewardId: string, costOverride?: number) => void
  requestRedemption: (kidId: string, rewardId: string) => void
  approveRedemption: (transactionId: string) => void
  denyRedemption: (transactionId: string) => void
  removeTransaction: (id: string) => void

  // Kid badges
  awardBadge: (kidId: string, badgeId: string) => void

  // Computed helpers
  getBalance: (kidId: string) => number
  getPendingCount: (kidId?: string) => number
  getKidBadges: (kidId: string) => KidBadge[]
  getTransactions: (kidId: string) => Transaction[]
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

  // Persist to localStorage whenever store changes
  useEffect(() => {
    saveStore(store)
  }, [store])

  // ── Family ────────────────────────────────────────────────────────────────

  const createFamily = useCallback((name: string) => {
    const familyId = generateId()
    const family: Family = { id: familyId, name, createdAt: new Date().toISOString() }
    const categories: Category[] = SEED_CATEGORIES.map(c => ({ ...c, familyId }))
    const actions: Action[] = SEED_ACTIONS.map(a => ({
      ...a,
      id: generateId(),
      familyId,
    }))
    dispatch({ type: 'CREATE_FAMILY', payload: { family, categories, actions } })
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
    (kidId: string, actionId: string, amount?: number, reason?: string) => {
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
    awardBadge,
    getBalance,
    getPendingCount,
    getKidBadges,
    getTransactions,
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>')
  return ctx
}
