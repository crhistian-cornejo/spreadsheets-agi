import { expect, test, type Page } from '@playwright/test'

const credentials = {
  email: process.env.E2E_EMAIL || '',
  password: process.env.E2E_PASSWORD || '',
}

async function login(page: Page) {
  test.skip(
    !credentials.email || !credentials.password,
    'Missing E2E credentials',
  )

  await page.goto('/login')

  await page.getByPlaceholder('tu@email.com').fill(credentials.email)
  await page.getByPlaceholder('••••••••').fill(credentials.password)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForTimeout(1000)

  const loginError = page.getByText('Invalid login credentials')
  if (await loginError.isVisible()) {
    throw new Error('Invalid login credentials for E2E user')
  }

  await page.waitForURL('**/workspace')
}

test('AI chat renders empty layout', async ({ page }) => {
  await login(page)

  await page.getByRole('button', { name: 'AI Chat' }).click()

  await expect(
    page.getByPlaceholder('Pregúntame cualquier cosa sobre datos...'),
  ).toBeVisible()
  await expect(page.getByText('Hola! Soy', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI Chat' })).toBeVisible()
})
