import { loadStore, saveStore, clearStore, DEFAULT_STORE } from '@/lib/store'
import type { AppStore } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: global })

const STORAGE_KEY = 'motivate_your_kids_v1'

beforeEach(() => {
  localStorageMock.clear()
})

describe('DEFAULT_STORE', () => {
  it('has null family', () => {
    expect(DEFAULT_STORE.family).toBeNull()
  })

  it('has empty arrays for all collections', () => {
    expect(DEFAULT_STORE.kids).toEqual([])
    expect(DEFAULT_STORE.actions).toEqual([])
    expect(DEFAULT_STORE.badges).toEqual([])
    expect(DEFAULT_STORE.rewards).toEqual([])
    expect(DEFAULT_STORE.transactions).toEqual([])
    expect(DEFAULT_STORE.kidBadges).toEqual([])
    expect(DEFAULT_STORE.categories).toEqual([])
  })
})

describe('loadStore', () => {
  it('returns DEFAULT_STORE when localStorage is empty', () => {
    expect(loadStore()).toEqual(DEFAULT_STORE)
  })

  it('returns parsed store from localStorage', () => {
    const data: AppStore = {
      ...DEFAULT_STORE,
      family: { id: 'fam-1', name: 'Test Family', createdAt: '2024-01-01' },
    }
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(data))
    expect(loadStore()).toEqual(data)
  })

  it('returns DEFAULT_STORE when JSON is malformed', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-valid-json{{{')
    expect(loadStore()).toEqual(DEFAULT_STORE)
  })

  it('merges with DEFAULT_STORE so future new keys are present', () => {
    // Simulate an old store that is missing a key
    const oldStore = { family: null, kids: [], categories: [], actions: [] }
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(oldStore))
    const loaded = loadStore()
    expect(loaded.badges).toEqual([])
    expect(loaded.rewards).toEqual([])
    expect(loaded.transactions).toEqual([])
  })
})

describe('saveStore', () => {
  it('persists store to localStorage', () => {
    const data: AppStore = {
      ...DEFAULT_STORE,
      family: { id: 'fam-1', name: 'My Family', createdAt: '2024-01-01' },
    }
    saveStore(data)
    const raw = localStorageMock.getItem(STORAGE_KEY)
    expect(JSON.parse(raw!)).toEqual(data)
  })
})

describe('clearStore', () => {
  it('removes the key from localStorage', () => {
    saveStore(DEFAULT_STORE)
    clearStore()
    expect(localStorageMock.getItem(STORAGE_KEY)).toBeNull()
  })

  it('loadStore returns DEFAULT_STORE after clearStore', () => {
    saveStore({ ...DEFAULT_STORE, family: { id: 'x', name: 'X', createdAt: 'now' } })
    clearStore()
    expect(loadStore()).toEqual(DEFAULT_STORE)
  })
})
