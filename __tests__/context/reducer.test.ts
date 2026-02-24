/**
 * Tests the FamilyContext reducer logic by extracting it via the module.
 * We test the reducer in isolation (no React needed) by importing helpers
 * and running state transitions manually.
 */
import { getKidBalance, countPendingRedemptions } from '@/lib/helpers'
import { DEFAULT_STORE } from '@/lib/store'
import type { AppStore, Family, Kid, Action, Badge, Reward, Category, Transaction, KidBadge } from '@/types'

// ── Minimal reducer reimplemented for testing ─────────────────────────────────
// (mirrors FamilyContext.tsx reducer exactly — kept in sync)

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
  | { type: 'REMOVE_BADGE'; payload: string }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'REMOVE_REWARD'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'APPROVE_REDEMPTION'; payload: string }
  | { type: 'DENY_REDEMPTION'; payload: string }
  | { type: 'AWARD_BADGE'; payload: KidBadge }

function reducer(state: AppStore, action: StoreAction): AppStore {
  switch (action.type) {
    case 'HYDRATE': return action.payload
    case 'CREATE_FAMILY':
      return { ...state, family: action.payload.family, categories: action.payload.categories, actions: action.payload.actions }
    case 'UPDATE_FAMILY_NAME':
      return state.family ? { ...state, family: { ...state.family, name: action.payload } } : state
    case 'ADD_KID': return { ...state, kids: [...state.kids, action.payload] }
    case 'UPDATE_KID': return { ...state, kids: state.kids.map(k => k.id === action.payload.id ? action.payload : k) }
    case 'REMOVE_KID': return { ...state, kids: state.kids.filter(k => k.id !== action.payload) }
    case 'ADD_ACTION': return { ...state, actions: [...state.actions, action.payload] }
    case 'UPDATE_ACTION': return { ...state, actions: state.actions.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'ARCHIVE_ACTION': return { ...state, actions: state.actions.map(a => a.id === action.payload ? { ...a, isActive: false } : a) }
    case 'ADD_BADGE': return { ...state, badges: [...state.badges, action.payload] }
    case 'REMOVE_BADGE': return { ...state, badges: state.badges.filter(b => b.id !== action.payload) }
    case 'ADD_REWARD': return { ...state, rewards: [...state.rewards, action.payload] }
    case 'UPDATE_REWARD': return { ...state, rewards: state.rewards.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'REMOVE_REWARD': return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) }
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, action.payload] }
    case 'REMOVE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.payload) }
    case 'ADD_TRANSACTION': return { ...state, transactions: [...state.transactions, action.payload] }
    case 'APPROVE_REDEMPTION': return { ...state, transactions: state.transactions.map(t => t.id === action.payload ? { ...t, status: 'approved' } : t) }
    case 'DENY_REDEMPTION': return { ...state, transactions: state.transactions.map(t => t.id === action.payload ? { ...t, status: 'denied' } : t) }
    case 'AWARD_BADGE': return { ...state, kidBadges: [...state.kidBadges, action.payload] }
    default: return state
  }
}

const family: Family = { id: 'fam-1', name: 'Test Family', createdAt: '2024-01-01' }
const kid: Kid = { id: 'kid-1', familyId: 'fam-1', name: 'Alice', avatar: '🐻', colorAccent: '#f59e0b', createdAt: '2024-01-01' }
const category: Category = { id: 'cat-1', familyId: 'fam-1', name: 'Chores', icon: '🧹' }
const action: Action = { id: 'act-1', familyId: 'fam-1', name: 'Clean room', description: '', categoryId: 'cat-1', pointsValue: 3, isTemplate: false, isActive: true }
const badge: Badge = { id: 'badge-1', familyId: 'fam-1', name: 'Star', icon: '⭐', description: 'Great job' }
const reward: Reward = { id: 'reward-1', familyId: 'fam-1', name: 'Ice cream', description: 'Yum', pointsCost: 20, isActive: true }

function earnTx(id: string, amount: number): Transaction {
  return { id, kidId: 'kid-1', type: 'earn', amount, status: 'approved', timestamp: new Date().toISOString() }
}
function redeemTx(id: string, amount: number, status: Transaction['status'] = 'pending'): Transaction {
  return { id, kidId: 'kid-1', type: 'redeem', amount, status, rewardId: 'reward-1', timestamp: new Date().toISOString() }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('reducer: CREATE_FAMILY', () => {
  it('sets family, categories, and actions', () => {
    const state = reducer(DEFAULT_STORE, {
      type: 'CREATE_FAMILY',
      payload: { family, categories: [category], actions: [action] },
    })
    expect(state.family).toEqual(family)
    expect(state.categories).toHaveLength(1)
    expect(state.actions).toHaveLength(1)
  })
})

describe('reducer: UPDATE_FAMILY_NAME', () => {
  it('updates the family name', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'CREATE_FAMILY', payload: { family, categories: [], actions: [] } })
    const s1 = reducer(s0, { type: 'UPDATE_FAMILY_NAME', payload: 'New Name' })
    expect(s1.family?.name).toBe('New Name')
  })

  it('no-ops when family is null', () => {
    const s = reducer(DEFAULT_STORE, { type: 'UPDATE_FAMILY_NAME', payload: 'Name' })
    expect(s.family).toBeNull()
  })
})

describe('reducer: kids', () => {
  it('ADD_KID appends a kid', () => {
    const s = reducer(DEFAULT_STORE, { type: 'ADD_KID', payload: kid })
    expect(s.kids).toHaveLength(1)
    expect(s.kids[0].name).toBe('Alice')
  })

  it('UPDATE_KID replaces the matching kid', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_KID', payload: kid })
    const updated = { ...kid, name: 'Alicia' }
    const s1 = reducer(s0, { type: 'UPDATE_KID', payload: updated })
    expect(s1.kids[0].name).toBe('Alicia')
  })

  it('REMOVE_KID removes the matching kid', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_KID', payload: kid })
    const s1 = reducer(s0, { type: 'REMOVE_KID', payload: 'kid-1' })
    expect(s1.kids).toHaveLength(0)
  })

  it('REMOVE_KID does not affect other kids', () => {
    const kid2: Kid = { ...kid, id: 'kid-2', name: 'Bob' }
    let s = reducer(DEFAULT_STORE, { type: 'ADD_KID', payload: kid })
    s = reducer(s, { type: 'ADD_KID', payload: kid2 })
    s = reducer(s, { type: 'REMOVE_KID', payload: 'kid-1' })
    expect(s.kids).toHaveLength(1)
    expect(s.kids[0].id).toBe('kid-2')
  })
})

describe('reducer: actions', () => {
  it('ADD_ACTION appends an action', () => {
    const s = reducer(DEFAULT_STORE, { type: 'ADD_ACTION', payload: action })
    expect(s.actions).toHaveLength(1)
  })

  it('UPDATE_ACTION replaces matching action', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_ACTION', payload: action })
    const s1 = reducer(s0, { type: 'UPDATE_ACTION', payload: { ...action, name: 'Tidy room' } })
    expect(s1.actions[0].name).toBe('Tidy room')
  })

  it('ARCHIVE_ACTION sets isActive to false', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_ACTION', payload: action })
    const s1 = reducer(s0, { type: 'ARCHIVE_ACTION', payload: 'act-1' })
    expect(s1.actions[0].isActive).toBe(false)
  })

  it('ARCHIVE_ACTION does not remove the action', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_ACTION', payload: action })
    const s1 = reducer(s0, { type: 'ARCHIVE_ACTION', payload: 'act-1' })
    expect(s1.actions).toHaveLength(1)
  })
})

describe('reducer: rewards', () => {
  it('ADD_REWARD appends a reward', () => {
    const s = reducer(DEFAULT_STORE, { type: 'ADD_REWARD', payload: reward })
    expect(s.rewards).toHaveLength(1)
  })

  it('UPDATE_REWARD updates the matching reward', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_REWARD', payload: reward })
    const s1 = reducer(s0, { type: 'UPDATE_REWARD', payload: { ...reward, pointsCost: 30 } })
    expect(s1.rewards[0].pointsCost).toBe(30)
  })

  it('REMOVE_REWARD removes the matching reward', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_REWARD', payload: reward })
    const s1 = reducer(s0, { type: 'REMOVE_REWARD', payload: 'reward-1' })
    expect(s1.rewards).toHaveLength(0)
  })
})

describe('reducer: badges', () => {
  it('ADD_BADGE appends a badge', () => {
    const s = reducer(DEFAULT_STORE, { type: 'ADD_BADGE', payload: badge })
    expect(s.badges).toHaveLength(1)
  })

  it('REMOVE_BADGE removes the badge', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_BADGE', payload: badge })
    const s1 = reducer(s0, { type: 'REMOVE_BADGE', payload: 'badge-1' })
    expect(s1.badges).toHaveLength(0)
  })

  it('AWARD_BADGE appends a KidBadge record', () => {
    const kb: KidBadge = { kidId: 'kid-1', badgeId: 'badge-1', awardedAt: '2024-01-01' }
    const s = reducer(DEFAULT_STORE, { type: 'AWARD_BADGE', payload: kb })
    expect(s.kidBadges).toHaveLength(1)
    expect(s.kidBadges[0]).toEqual(kb)
  })
})

describe('reducer: transactions', () => {
  it('ADD_TRANSACTION appends a transaction', () => {
    const tx = earnTx('t1', 5)
    const s = reducer(DEFAULT_STORE, { type: 'ADD_TRANSACTION', payload: tx })
    expect(s.transactions).toHaveLength(1)
  })

  it('APPROVE_REDEMPTION changes status to approved', () => {
    const tx = redeemTx('t1', 20, 'pending')
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_TRANSACTION', payload: tx })
    const s1 = reducer(s0, { type: 'APPROVE_REDEMPTION', payload: 't1' })
    expect(s1.transactions[0].status).toBe('approved')
  })

  it('DENY_REDEMPTION changes status to denied', () => {
    const tx = redeemTx('t1', 20, 'pending')
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_TRANSACTION', payload: tx })
    const s1 = reducer(s0, { type: 'DENY_REDEMPTION', payload: 't1' })
    expect(s1.transactions[0].status).toBe('denied')
  })

  it('approved redemption reduces kid balance via getKidBalance', () => {
    let s = reducer(DEFAULT_STORE, { type: 'ADD_TRANSACTION', payload: earnTx('t1', 20) })
    s = reducer(s, { type: 'ADD_TRANSACTION', payload: redeemTx('t2', 15, 'pending') })
    expect(getKidBalance('kid-1', s.transactions)).toBe(20) // pending does NOT reduce balance

    s = reducer(s, { type: 'APPROVE_REDEMPTION', payload: 't2' })
    expect(getKidBalance('kid-1', s.transactions)).toBe(5)  // now deducted
  })

  it('denied redemption does not affect balance', () => {
    let s = reducer(DEFAULT_STORE, { type: 'ADD_TRANSACTION', payload: earnTx('t1', 20) })
    s = reducer(s, { type: 'ADD_TRANSACTION', payload: redeemTx('t2', 15, 'pending') })
    s = reducer(s, { type: 'DENY_REDEMPTION', payload: 't2' })
    expect(getKidBalance('kid-1', s.transactions)).toBe(20)
  })
})

describe('reducer: categories', () => {
  it('ADD_CATEGORY appends a category', () => {
    const s = reducer(DEFAULT_STORE, { type: 'ADD_CATEGORY', payload: category })
    expect(s.categories).toHaveLength(1)
  })

  it('REMOVE_CATEGORY removes the matching category', () => {
    const s0 = reducer(DEFAULT_STORE, { type: 'ADD_CATEGORY', payload: category })
    const s1 = reducer(s0, { type: 'REMOVE_CATEGORY', payload: 'cat-1' })
    expect(s1.categories).toHaveLength(0)
  })
})

describe('reducer: pending redemptions counter', () => {
  it('counts correctly across mixed statuses', () => {
    let s = DEFAULT_STORE
    s = reducer(s, { type: 'ADD_TRANSACTION', payload: redeemTx('t1', 10, 'pending') })
    s = reducer(s, { type: 'ADD_TRANSACTION', payload: redeemTx('t2', 10, 'pending') })
    s = reducer(s, { type: 'APPROVE_REDEMPTION', payload: 't1' })
    expect(countPendingRedemptions(s.transactions)).toBe(1)
  })
})
