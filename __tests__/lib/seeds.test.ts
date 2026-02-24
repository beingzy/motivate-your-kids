import { SEED_CATEGORIES, SEED_ACTIONS, SEED_REWARDS } from '@/lib/seeds'

describe('SEED_CATEGORIES', () => {
  it('contains at least the 5 built-in categories', () => {
    expect(SEED_CATEGORIES.length).toBeGreaterThanOrEqual(5)
  })

  it('each category has id, name, and icon', () => {
    for (const cat of SEED_CATEGORIES) {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.icon).toBeTruthy()
    }
  })

  it('has no duplicate ids', () => {
    const ids = SEED_CATEGORIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('SEED_ACTIONS', () => {
  it('contains starter actions', () => {
    expect(SEED_ACTIONS.length).toBeGreaterThan(0)
  })

  it('each action has required fields', () => {
    for (const action of SEED_ACTIONS) {
      expect(action.name).toBeTruthy()
      expect(action.categoryId).toBeTruthy()
      expect(typeof action.pointsValue).toBe('number')
      expect(action.pointsValue).toBeGreaterThanOrEqual(1)
      expect(action.pointsValue).toBeLessThanOrEqual(10)
    }
  })

  it('all action categoryIds reference a known seed category', () => {
    const catIds = new Set(SEED_CATEGORIES.map(c => c.id))
    for (const action of SEED_ACTIONS) {
      expect(catIds.has(action.categoryId)).toBe(true)
    }
  })

  it('all actions are marked as templates and active', () => {
    for (const action of SEED_ACTIONS) {
      expect(action.isTemplate).toBe(true)
      expect(action.isActive).toBe(true)
    }
  })
})

describe('SEED_REWARDS', () => {
  it('contains starter rewards', () => {
    expect(SEED_REWARDS.length).toBeGreaterThan(0)
  })

  it('each reward has name, description, and a positive pointsCost', () => {
    for (const r of SEED_REWARDS) {
      expect(r.name).toBeTruthy()
      expect(r.description).toBeTruthy()
      expect(r.pointsCost).toBeGreaterThan(0)
    }
  })
})
