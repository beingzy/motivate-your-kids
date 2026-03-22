/**
 * Auth screen screenshots — login, signup, verify.
 * Saves PNGs to tests/auth-screens/
 */
import { chromium } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const OUT_DIR = path.join(process.cwd(), 'tests', 'auth-screens')

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  })
  const page = await ctx.newPage()

  async function shot(name: string) {
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false })
    console.log(`  ✓ ${name}.png`)
  }

  // Login page
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await shot('01-login')

  // Login — filled
  await page.fill('input[type="email"]', 'parent@example.com')
  await page.fill('input[type="password"]', 'mypassword123')
  await shot('02-login-filled')

  // Login — error state (wrong password)
  await page.fill('input[type="email"]', 'parent@example.com')
  await page.fill('input[type="password"]', 'wrongpass')
  // Inject an error by evaluating (can't actually call Supabase in test)
  await page.evaluate(() => {
    const p = document.createElement('p')
    p.textContent = 'Incorrect email or password.'
    p.className = 'text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3'
    document.querySelector('form')?.insertBefore(p, document.querySelector('button[type="submit"]'))
  })
  await shot('03-login-error')

  // Signup page
  await page.goto(`${BASE_URL}/signup`)
  await page.waitForLoadState('networkidle')
  await shot('04-signup')

  // Signup — filled
  await page.fill('input[type="email"]', 'parent@example.com')
  const pwFields = page.locator('input[type="password"]')
  await pwFields.nth(0).fill('mypassword123')
  await pwFields.nth(1).fill('mypassword123')
  await shot('05-signup-filled')

  // Verify page
  await page.goto(`${BASE_URL}/signup/verify?email=parent%40example.com`)
  await page.waitForLoadState('networkidle')
  await shot('06-verify-empty')

  // Verify — code entered
  await page.fill('input[inputmode="numeric"]', '482916')
  await shot('07-verify-code-entered')

  await browser.close()
  console.log(`\n✅ Auth screenshots saved to tests/auth-screens/`)
}

main().catch(err => { console.error(err); process.exit(1) })
