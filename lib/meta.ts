// Stores app-level metadata separately from family data so it survives
// family resets and can be used for version-gated onboarding.
const META_KEY = 'motivate_your_kids_meta'

interface AppMeta {
  lastSeenVersion: string
  guideDismissed: boolean
}

const DEFAULT_META: AppMeta = {
  lastSeenVersion: '',
  guideDismissed: false,
}

export function loadMeta(): AppMeta {
  if (typeof window === 'undefined') return DEFAULT_META
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return { ...DEFAULT_META }
    return { ...DEFAULT_META, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_META }
  }
}

export function saveMeta(patch: Partial<AppMeta>): void {
  if (typeof window === 'undefined') return
  const current = loadMeta()
  localStorage.setItem(META_KEY, JSON.stringify({ ...current, ...patch }))
}
