import { test, expect } from '@playwright/test'

test.describe('Auth page', () => {
  test('loads the login page at /auth', async ({ page }) => {
    await page.goto('/auth')
    // Login tab should be visible
    await expect(page.getByRole('button', { name: /Log In|כניסה/i })).toBeVisible()
  })

  test('switches to register tab', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /Sign Up|הרשמה/i }).first().click()
    // Name field should appear on register form
    await expect(page.getByPlaceholder(/Name|שם/i)).toBeVisible()
  })

  test('unauthenticated user is redirected from /lists to /auth', async ({ page }) => {
    await page.goto('/lists')
    await expect(page).toHaveURL(/\/auth/)
  })
})
