// Avatar utility — supports emoji, preset SVGs, and uploaded photo URLs.
// Platform-specific rendering (presetAvatarSrc) lives in each app, not here.

export type AvatarType = 'emoji' | 'preset' | 'url'

export interface ParsedAvatar {
  type: AvatarType
  value: string
}

/** Preset avatar filenames (without extension) from Figma export — 30 avatars */
export const PRESET_AVATARS = [
  'frog', 'pig', 'fox', 'penguin', 'shiba', 'bunny',
  'bear', 'calico-cat', 'elephant', 'gray-cat', 'polar-bear', 'hamster',
  'panda', 'duck', 'horse', 'pigeon', 'parrot', 'cow',
  'red-panda', 'koala', 'rabbit', 'beaver', 'sheep', 'deer',
  'tiger', 'lion', 'sloth', 'hippo', 'turtle', 'polar-bear-cub',
] as const

/** Default emoji avatars */
export const EMOJI_AVATARS = [
  '🧒', '👧', '👦', '👶', '🧒🏻', '👧🏻', '👦🏻',
  '🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁',
  '🐸', '🐵', '🦄', '🐧', '🐻', '🐯',
]

/** Parse an avatar string into its type and display value */
export function parseAvatar(avatar: string): ParsedAvatar {
  if (avatar.startsWith('preset:')) {
    return { type: 'preset', value: avatar.slice(7) }
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return { type: 'url', value: avatar }
  }
  return { type: 'emoji', value: avatar }
}
