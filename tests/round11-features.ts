/**
 * Round 11 feature screenshots — Family ownership, join flow, daily chart.
 * Requires: SKIP_AUTH_FOR_SCREENSHOTS=true in .env.local
 * Saves PNGs to tests/round11-features/
 */
import { chromium } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const OUT_DIR = path.join(process.cwd(), 'tests', 'round11-features')

const SEED_DATA = {
  family: { id: 'f1', name: 'The Smiths', displayCode: 'SMT-4K2', ownerId: 'm1', createdAt: '2026-03-01' },
  kids: [
    { id: 'k1', familyId: 'f1', name: 'Mia', avatar: 'preset:avatar-01', colorAccent: '#F59E0B', createdAt: '2026-03-01', wishlist: [] },
    { id: 'k2', familyId: 'f1', name: 'Leo', avatar: '🦊', colorAccent: '#3B82F6', createdAt: '2026-03-01', wishlist: [] },
  ],
  categories: [
    { id: 'c1', familyId: 'f1', name: 'Chores', icon: '🧹' },
    { id: 'c2', familyId: 'f1', name: 'Learning', icon: '📚' },
  ],
  actions: [
    { id: 'a1', familyId: 'f1', name: 'Clean room', description: '', categoryId: 'c1', pointsValue: 5, isDeduction: false, isTemplate: false, isActive: true },
    { id: 'a2', familyId: 'f1', name: 'Read a book', description: '', categoryId: 'c2', pointsValue: 3, isDeduction: false, isTemplate: false, isActive: true },
    { id: 'a3', familyId: 'f1', name: 'Screen time over', description: '', categoryId: '', pointsValue: 2, isDeduction: true, isTemplate: false, isActive: true },
  ],
  badges: [],
  rewards: [
    { id: 'r1', familyId: 'f1', name: 'Movie Night', description: 'Pick a movie', pointsCost: 20, isActive: true },
  ],
  transactions: [
    // Today
    { id: 't1', kidId: 'k1', type: 'earn', amount: 5, actionId: 'a1', status: 'approved', timestamp: new Date().toISOString() },
    { id: 't2', kidId: 'k2', type: 'earn', amount: 3, actionId: 'a2', status: 'approved', timestamp: new Date().toISOString() },
    { id: 't3', kidId: 'k1', type: 'deduct', amount: 2, actionId: 'a3', status: 'approved', timestamp: new Date().toISOString() },
    // Yesterday
    { id: 't4', kidId: 'k1', type: 'earn', amount: 10, actionId: 'a1', status: 'approved', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 't5', kidId: 'k2', type: 'earn', amount: 8, actionId: 'a2', status: 'approved', timestamp: new Date(Date.now() - 86400000).toISOString() },
    // 2 days ago
    { id: 't6', kidId: 'k1', type: 'earn', amount: 3, status: 'approved', timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: 't7', kidId: 'k2', type: 'deduct', amount: 5, status: 'approved', timestamp: new Date(Date.now() - 172800000).toISOString() },
    // 3 days ago
    { id: 't8', kidId: 'k1', type: 'earn', amount: 7, status: 'approved', timestamp: new Date(Date.now() - 259200000).toISOString() },
  ],
  kidBadges: [],
  familyMembers: [
    { id: 'm1', familyId: 'f1', name: 'Sarah', avatar: '👩', role: 'mother', birthday: '1990-05-15', isOwner: true, createdAt: '2026-03-01' },
    { id: 'm2', familyId: 'f1', name: 'Mike', avatar: 'preset:avatar-05', role: 'father', createdAt: '2026-03-01' },
    { id: 'm3', familyId: 'f1', name: 'Grandma Li', avatar: '👵', role: 'grandma', birthday: '1960-01-20', createdAt: '2026-03-10' },
  ],
  familyInvites: [
    {
      id: 'inv1', familyId: 'f1', token: 'abc123', role: 'grandpa' as const,
      status: 'approved' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
    },
    {
      id: 'inv2', familyId: 'f1', token: 'def456', role: 'uncle' as const,
      status: 'pending_approval' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 22 * 3600000).toISOString(),
    },
  ],
  joinRequests: [
    {
      id: 'jr1', familyId: 'f1', requesterName: 'Uncle Bob',
      requesterAvatar: '👨‍🦱', requestedRole: 'uncle' as const,
      status: 'pending' as const, createdAt: new Date().toISOString(),
    },
  ],
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  })

  await ctx.addInitScript((data: typeof SEED_DATA) => {
    localStorage.setItem('motivate_your_kids_v1', JSON.stringify(data))
  }, SEED_DATA)

  const page = await ctx.newPage()

  async function shot(name: string) {
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false })
    console.log(`  ✓ ${name}.png`)
  }

  // 1. Home page with daily chart
  await page.goto(`${BASE_URL}/parent`)
  await page.waitForLoadState('networkidle')
  await shot('01-home-with-chart')

  // 2. Scroll to see chart better
  await page.evaluate(() => window.scrollBy(0, 200))
  await shot('02-daily-chart-detail')

  // 3. Family members page with owner badge, join requests, and family code
  await page.goto(`${BASE_URL}/parent/family`)
  await page.waitForLoadState('networkidle')
  await shot('03-family-members-full')

  // 4. Scroll down to see all sections
  await page.evaluate(() => window.scrollBy(0, 400))
  await page.waitForTimeout(300)
  await shot('04-family-invites-ownership')

  // 5. Setup page — choice screen (clear localStorage first)
  await page.evaluate(() => localStorage.removeItem('motivate_your_kids_v1'))
  await page.goto(`${BASE_URL}/setup`)
  await page.waitForLoadState('networkidle')
  await shot('05-setup-choice')

  // 6. Create family path — profile setup
  await page.locator('button', { hasText: 'Create a new family' }).click()
  await page.waitForTimeout(400)
  await shot('06-profile-setup')

  // 7. Fill profile
  await page.fill('input[placeholder="e.g. Sarah"]', 'Sarah')
  await page.waitForTimeout(200)
  await shot('07-profile-filled')

  // 8. Back and choose Join path
  await page.locator('button', { hasText: 'Back' }).click()
  await page.waitForTimeout(300)
  await page.locator('button', { hasText: 'Join an existing family' }).click()
  await page.waitForTimeout(400)
  // Fill profile for join
  await page.fill('input[placeholder="e.g. Sarah"]', 'Uncle Bob')
  await page.locator('button', { hasText: 'Uncle' }).click()
  await page.locator('button', { hasText: 'Continue' }).click()
  await page.waitForTimeout(400)
  await shot('08-join-family-code')

  // 9. Enter a code
  await page.fill('input[placeholder="Enter family code"]', 'SMT-4K2')
  await shot('09-join-code-entered')

  await browser.close()
  console.log(`\n✅ Round 11 screenshots saved to tests/round11-features/`)
}

main().catch(err => { console.error(err); process.exit(1) })
