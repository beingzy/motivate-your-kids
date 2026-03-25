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
  JoinRequest,
  ProfileChangeRequest,
} from './types'

// ── Default store ─────────────────────────────────────────────────────────────

export const DEFAULT_STORE: AppStore = {
  family: null,
  kids: [],
  categories: [],
  actions: [],
  badges: [],
  rewards: [],
  transactions: [],
  kidBadges: [],
  familyMembers: [],
  familyInvites: [],
  joinRequests: [],
  profileChangeRequests: [],
}

// ── Reducer action types ──────────────────────────────────────────────────────

export type StoreAction =
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

export function reducer(state: AppStore, action: StoreAction): AppStore {
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
          t.id === action.payload ? { ...t, status: 'approved' as const } : t,
        ),
      }

    case 'DENY_REDEMPTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload ? { ...t, status: 'denied' as const } : t,
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
