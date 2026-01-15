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

test('native mode renders AI assistant panel', async ({ page }) => {
  await login(page)

  await page.getByRole('button', { name: 'Native' }).click()

  await page.getByRole('button', { name: 'Asistente IA' }).click()

  await expect(page.getByText('Asistente IA')).toBeVisible()
  await expect(page.getByPlaceholder('Escribe un comando...')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Native' })).toBeVisible()
})
