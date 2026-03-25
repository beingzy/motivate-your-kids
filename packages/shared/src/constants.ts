import type { FamilyRole } from './types'

/** localStorage key for family data store */
export const STORAGE_KEY = 'motivate_your_kids_v1'

/** localStorage key for app metadata (language, sound, etc.) */
export const META_KEY = 'motivate_your_kids_meta'

/** All valid family member roles */
export const FAMILY_ROLES: FamilyRole[] = [
  'mother', 'father', 'grandma', 'grandpa', 'aunt', 'uncle', 'nanny', 'other',
]

/** Roles limited to one per family */
export const SINGLE_OCCUPANCY_ROLES: FamilyRole[] = ['mother', 'father']

/** Maximum rewards a kid can wishlist */
export const MAX_WISHLIST_SIZE = 3

/** Maximum voice memo duration in seconds */
export const MAX_VOICE_MEMO_SECONDS = 10

/** Maximum photo dimension after client-side resize */
export const MAX_PHOTO_DIMENSION = 800

/** Default kid accent colors for auto-assignment */
export const DEFAULT_KID_COLORS = [
  '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
]

/** Invite link expiry in hours */
export const INVITE_EXPIRY_HOURS = 24
