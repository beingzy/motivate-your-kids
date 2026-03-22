import type { AppStore } from '@/types'

const STORAGE_KEY = 'motivate_your_kids_v1'

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

export function loadStore(): AppStore {
  if (typeof window === 'undefined') return DEFAULT_STORE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORE
    // Merge with defaults so new keys added in future versions are present
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STORE
  }
}

export function saveStore(store: AppStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function clearStore(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
