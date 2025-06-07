import { _electron as electron, expect, test } from '@playwright/test'

// Launch the Electron app and open the settings modal
test('open settings from main window', async () => {
  const electronApp = await electron.launch({ args: ['.', '--no-sandbox'] })

  const window = await electronApp.firstWindow()
  await window.getByRole('button', { name: 'Settings' }).click()

  await expect(window.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await electronApp.close()
})
