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

test('chat shows artifact panel after tool call', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    const toolCallId = 'tool-call-1'
    const sse = [
      'data: {"type":"start","messageId":"assistant-1"}\n\n',
      'data: {"type":"tool-input-available","toolCallId":"tool-call-1","toolName":"createSpreadsheet","input":{"title":"Demo Sheet","columns":["Col"],"rows":[["1"]]}}\n\n',
      `data: {"type":"tool-output-available","toolCallId":"${toolCallId}","output":{"success":true,"sheetId":"sheet-1","title":"Demo Sheet","columns":["Col"],"rowCount":1,"workbookData":{}}}\n\n`,
      'data: {"type":"finish","finishReason":"tool-calls"}\n\n',
    ].join('')

    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body: sse,
    })
  })

  await login(page)

  await page.getByRole('button', { name: 'AI Chat' }).click()

  const input = page.getByPlaceholder(
    'Pregúntame cualquier cosa sobre datos...',
  )
  await input.fill('crea un spreadsheet')
  await input.press('Enter')

  await expect(page.getByText('Demo Sheet')).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI Chat' })).toBeVisible()
})
