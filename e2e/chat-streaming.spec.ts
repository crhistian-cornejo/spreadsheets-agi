import { expect, test } from '@playwright/test'

test('chat streams a response after sending message', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    const sse = [
      'data: {"type":"start","messageId":"assistant-1"}\n\n',
      'data: {"type":"text-start","id":"text-1"}\n\n',
      'data: {"type":"text-delta","id":"text-1","delta":"Hola"}\n\n', 
      'data: {"type":"text-end","id":"text-1"}\n\n',
      'data: {"type":"finish","finishReason":"stop"}\n\n',
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

  await page.goto('/workspace')

  await page.getByRole('button', { name: 'AI Chat' }).click()

  const input = page.getByPlaceholder(
    'Pregúntame cualquier cosa sobre datos...',
  )
  await input.fill('hola')
  await input.press('Enter')

  const userMessage = page.getByText('hola', { exact: false })
  await expect(userMessage).toBeVisible()

  await expect(page.getByText('Hola', { exact: false })).toBeVisible()
})
