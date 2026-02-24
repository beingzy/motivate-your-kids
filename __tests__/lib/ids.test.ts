import { generateId } from '@/lib/ids'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('includes a timestamp component (starts with digits)', () => {
    const id = generateId()
    expect(id).toMatch(/^\d+-.+/)
  })

  it('generates unique IDs on repeated calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()))
    expect(ids.size).toBe(1000)
  })
})
