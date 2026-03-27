// Avatar utility — supports emoji, preset SVGs, kid animal PNGs, and uploaded photo URLs.

export type AvatarType = 'emoji' | 'preset' | 'kid' | 'url'

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

/** Kid animal avatar filenames (without extension) — 36 animal avatars */
export const KID_AVATARS = [
  'axolotl', 'bat', 'bear', 'bee', 'bluebird', 'bunny',
  'cat', 'chick', 'chicken', 'cow', 'dinosaur', 'dog',
  'duck', 'elephant', 'fox', 'frog', 'giraffe', 'goldfish',
  'hamster', 'hedgehog', 'jellyfish', 'kitten', 'koala', 'octopus',
  'otter', 'panda', 'penguin', 'pig', 'seal', 'sheep',
  'sloth', 'snail', 'sprout-snail', 'squirrel', 'toad', 'turtle',
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
  if (avatar.startsWith('kid:')) {
    return { type: 'kid', value: avatar.slice(4) }
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

/** Get the display src for a kid animal avatar */
export function kidAvatarSrc(name: string): string {
  return `/avatars/kids/${name}.png`
}
