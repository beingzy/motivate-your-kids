// Avatar decoration frames — data and unlock logic (no CSS/platform styling).

export interface AvatarFrame {
  id: string
  label: string
  emoji: string
  unlockCost: number // 0 = free
}

export const AVATAR_FRAMES: AvatarFrame[] = [
  { id: 'none', label: 'None', emoji: '⚪', unlockCost: 0 },
  { id: 'stars', label: 'Stars', emoji: '⭐', unlockCost: 0 },
  { id: 'hearts', label: 'Hearts', emoji: '❤️', unlockCost: 50 },
  { id: 'flowers', label: 'Flowers', emoji: '🌸', unlockCost: 75 },
  { id: 'crown', label: 'Crown', emoji: '👑', unlockCost: 100 },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈', unlockCost: 150 },
  { id: 'lightning', label: 'Lightning', emoji: '⚡', unlockCost: 200 },
]

/** Check if a frame is unlocked for a given kid */
export function isFrameUnlocked(frameId: string, lifetimeStars: number): boolean {
  const frame = AVATAR_FRAMES.find(f => f.id === frameId)
  if (!frame) return false
  return lifetimeStars >= frame.unlockCost
}
