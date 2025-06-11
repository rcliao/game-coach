import { _electron as electron, expect, test } from '@playwright/test'

const launchApp = () => electron.launch({ args: ['.', '--no-sandbox'] })

test('open settings from main window', async () => {
  const electronApp = await launchApp()
  const page = await electronApp.firstWindow()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await electronApp.close()
})

test('settings modal shows basic fields', async () => {
  const electronApp = await launchApp()
  const page = await electronApp.firstWindow()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByText('Google Gemini API Key')).toBeVisible()
  await expect(page.getByText('System Instructions')).toBeVisible()
  await expect(page.getByText('Capture Source')).toBeVisible()
  await expect(page.getByText('Enable Overlay')).toBeVisible()
  await electronApp.close()
})
