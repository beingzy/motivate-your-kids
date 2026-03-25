import type { Category, Action } from './types'

/**
 * Seed categories (no familyId — added when creating a family).
 * IDs are stable so template actions can reference them by categoryId.
 */
export const SEED_CATEGORIES: Omit<Category, 'familyId'>[] = [
  { id: 'cat-chores', name: 'Chores', icon: '🧹' },
  { id: 'cat-academics', name: 'Academics', icon: '📚' },
  { id: 'cat-behavior', name: 'Behavior', icon: '😊' },
  { id: 'cat-health', name: 'Health', icon: '🏃' },
  { id: 'cat-creativity', name: 'Creativity', icon: '🎨' },
]

/**
 * Starter action templates (no id / familyId — added at family creation).
 * Parents can customize or delete any of these.
 */
export const SEED_ACTIONS: Omit<Action, 'id' | 'familyId'>[] = [
  {
    name: 'Clean your room',
    description: 'Tidy up and put everything in its place.',
    categoryId: 'cat-chores',
    pointsValue: 3,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
  {
    name: 'Set the table',
    description: 'Set the table before dinner.',
    categoryId: 'cat-chores',
    pointsValue: 2,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
  {
    name: 'Read for 20 minutes',
    description: 'Read any book of your choice.',
    categoryId: 'cat-academics',
    pointsValue: 5,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
  {
    name: 'Practice instrument',
    description: 'Practice your instrument for at least 15 minutes.',
    categoryId: 'cat-creativity',
    pointsValue: 4,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
  {
    name: 'Brush teeth',
    description: 'Brush teeth in the morning and before bed.',
    categoryId: 'cat-health',
    pointsValue: 2,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
  {
    name: 'Be kind to siblings',
    description: 'Share, cooperate, and help out.',
    categoryId: 'cat-behavior',
    pointsValue: 3,
    isDeduction: false,
    isTemplate: true,
    isActive: true,
  },
]

/** Default reward suggestions shown during onboarding. */
export const SEED_REWARDS: { name: string; description: string; pointsCost: number }[] = [
  { name: 'Extra screen time (30 min)', description: '30 extra minutes of screen time.', pointsCost: 20 },
  { name: 'Choose dinner tonight', description: 'Pick what the family eats for dinner.', pointsCost: 25 },
  { name: 'Stay up 30 min later', description: 'Bedtime extended by 30 minutes.', pointsCost: 30 },
  { name: 'Trip to the park', description: 'A special trip to your favourite park.', pointsCost: 40 },
]
