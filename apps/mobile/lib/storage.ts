import { MMKV } from 'react-native-mmkv'
import { STORAGE_KEY, META_KEY, DEFAULT_STORE } from '@mkids/shared'
import type { AppStore } from '@mkids/shared'

const mmkv = new MMKV()

export function loadStore(): AppStore {
  try {
    const raw = mmkv.getString(STORAGE_KEY)
    if (!raw) return DEFAULT_STORE
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STORE
  }
}

export function saveStore(store: AppStore): void {
  mmkv.set(STORAGE_KEY, JSON.stringify(store))
}

export function clearStore(): void {
  mmkv.delete(STORAGE_KEY)
}

// ── App metadata (language, sound, etc.) ──────────────────────────────────────

export interface AppMeta {
  lastSeenVersion: string
  guideDismissed: boolean
  language: string
  soundEnabled: boolean
}

const DEFAULT_META: AppMeta = {
  lastSeenVersion: '0.0.0',
  guideDismissed: false,
  language: 'en',
  soundEnabled: true,
}

export function loadMeta(): AppMeta {
  try {
    const raw = mmkv.getString(META_KEY)
    if (!raw) return DEFAULT_META
    return { ...DEFAULT_META, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_META
  }
}

export function saveMeta(patch: Partial<AppMeta>): void {
  const current = loadMeta()
  mmkv.set(META_KEY, JSON.stringify({ ...current, ...patch }))
}
