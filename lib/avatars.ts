// Avatar utility — supports emoji, preset SVGs, and uploaded photo URLs.

export type AvatarType = 'emoji' | 'preset' | 'url'

export interface ParsedAvatar {
  type: AvatarType
  value: string
}

/** Preset avatar filenames (without extension) from Figma export — 30 avatars */
export const PRESET_AVATARS = [
  'avatar-01', 'avatar-02', 'avatar-03', 'avatar-04', 'avatar-05', 'avatar-06',
  'avatar-07', 'avatar-08', 'avatar-09', 'avatar-10', 'avatar-11', 'avatar-12',
  'avatar-13', 'avatar-14', 'avatar-15', 'avatar-16', 'avatar-17', 'avatar-18',
  'avatar-19', 'avatar-20', 'avatar-21', 'avatar-22', 'avatar-23', 'avatar-24',
  'avatar-25', 'avatar-26', 'avatar-27', 'avatar-28', 'avatar-29', 'avatar-30',
] as const

/** Default emoji avatars (existing set from the app) */
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

/** Get the display src for a preset avatar */
export function presetAvatarSrc(name: string): string {
  return `/avatars/presets/${name}.svg`
}
