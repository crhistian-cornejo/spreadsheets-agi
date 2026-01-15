import { expect, test } from '@playwright/test'

const credentials = {
  email: process.env.E2E_EMAIL || '',
  password: process.env.E2E_PASSWORD || '',
}

test('chat CRUD persists in Supabase', async ({ page }) => {
  if (!credentials.email || !credentials.password) {
    test.skip(true, 'Missing E2E credentials')
  }

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

  await page.getByRole('button', { name: 'AI Chat' }).click()

  const newChatButton = page.getByRole('button', {
    name: 'Nueva conversación',
  })

  await expect(newChatButton).toBeVisible()

  await newChatButton.click()

  const chatTitle = page
    .getByRole('button', { name: 'Nueva conversación' })
    .first()

  await expect(chatTitle).toBeVisible()

  await page
    .getByPlaceholder('Pregúntame cualquier cosa sobre datos...')
    .fill('CRUD test')
  await page.keyboard.press('Enter')

  await expect(page.getByText('CRUD test', { exact: false })).toBeVisible()

  await page.reload()
  await page.waitForURL('**/workspace')
  await page.getByRole('button', { name: 'AI Chat' }).click()

  await expect(page.getByText('CRUD test', { exact: false })).toBeVisible()

  await page.getByRole('button', { name: 'Más opciones' }).first().click()
  await page.getByRole('menuitem', { name: 'Eliminar' }).click()

  await page.reload()
  await page.getByRole('button', { name: 'AI Chat' }).click()

  await expect(page.getByText('CRUD test', { exact: false })).not.toBeVisible()
})
