/** Generates a collision-resistant ID suitable for localStorage-scoped data. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
