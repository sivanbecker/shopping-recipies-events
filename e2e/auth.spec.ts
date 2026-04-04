import { test, expect } from '@playwright/test'

// ─── Smoke tests (no Supabase credentials required) ──────────────────────

test.describe('Auth page — smoke tests', () => {
  test('loads the login page at /auth', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('button', { name: /Log In|כניסה/i }).first()).toBeVisible()
  })

  test('switches to register tab', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /Sign Up|הרשמה/i }).first().click()
    await expect(page.getByPlaceholder(/Name|שם/i)).toBeVisible()
  })

  test('unauthenticated user is redirected from /lists to /auth', async ({ page }) => {
    await page.goto('/lists')
    await expect(page).toHaveURL(/\/auth/)
  })

  test('forgot password link shows reset form', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /Forgot password|שכחתי סיסמה/i }).click()
    await expect(page.getByRole('button', { name: /Send Reset Link|שלח קישור/i })).toBeVisible()
  })

  test('"back to login" returns to login tab', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /Forgot password|שכחתי סיסמה/i }).click()
    await page.getByRole('button', { name: /Back to Log In|חזרה לכניסה/i }).click()
    await expect(page.getByRole('button', { name: /Log In|כניסה/i }).first()).toBeVisible()
  })
})

// ─── Full auth flow (requires real Supabase credentials) ─────────────────
//
// Set these env vars to enable this test suite:
//   E2E_TEST_EMAIL=yourtest@example.com
//   E2E_TEST_PASSWORD=yourpassword
//
// The test account must already exist in your Supabase project.

const E2E_EMAIL = process.env.E2E_TEST_EMAIL
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD
const hasCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD)

test.describe('Auth flow — register / login / logout', () => {
  test.skip(!hasCredentials, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run these tests')

  test('login → see /lists → logout → redirect to /auth', async ({ page }) => {
    await page.goto('/auth')

    // Fill login form
    await page.getByLabel(/Email|אימייל/i).fill(E2E_EMAIL!)
    await page.getByLabel(/^Password|^סיסמה/i).fill(E2E_PASSWORD!)
    await page.getByRole('button', { name: /^Log In$|^כניסה$/i }).click()

    // Should land on lists page
    await expect(page).toHaveURL(/\/lists/, { timeout: 10_000 })

    // Navigate to profile and sign out
    await page.goto('/profile')
    await page.getByRole('button', { name: /Log Out|יציאה/i }).click()

    // Should redirect back to auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 5_000 })
  })

  test('session persists after page reload', async ({ page }) => {
    await page.goto('/auth')
    await page.getByLabel(/Email|אימייל/i).fill(E2E_EMAIL!)
    await page.getByLabel(/^Password|^סיסמה/i).fill(E2E_PASSWORD!)
    await page.getByRole('button', { name: /^Log In$|^כניסה$/i }).click()
    await expect(page).toHaveURL(/\/lists/, { timeout: 10_000 })

    await page.reload()
    await expect(page).toHaveURL(/\/lists/, { timeout: 5_000 })
  })
})
