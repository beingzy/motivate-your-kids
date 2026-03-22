/** Generates a collision-resistant ID suitable for localStorage-scoped data. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Generates a 6-digit numeric UID for display purposes. */
export function generateUid(): string {
  return String(100000 + Math.floor(Math.random() * 900000))
}

/** Generates a short, human-readable family code like "SMT-4K2". */
export function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
