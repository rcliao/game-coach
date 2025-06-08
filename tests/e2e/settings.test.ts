import { _electron as electron, expect, test } from '@playwright/test'

// Utility to launch the app for each test
const launchApp = () => electron.launch({ args: ['.', '--no-sandbox'] })

// Launch the Electron app and open the settings modal
test('open settings from main window', async () => {
  const electronApp = await launchApp()

  const page = await electronApp.firstWindow()
  await page.getByRole('button', { name: 'Settings' }).click()

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await electronApp.close()
})

test('overlay displays in top right by default', async () => {
  const electronApp = await launchApp()

  const page = await electronApp.firstWindow()

  // Open settings and go to Overlay tab
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Overlay', exact: true }).click()
  await expect(page.getByText('Enable Overlay')).toBeVisible()

  // Show overlay from overlay tab
  await page.getByRole('button', { name: 'Show Overlay' }).click()

  // Wait for overlay window
  const overlayPage = await electronApp.waitForEvent('window', win =>
    win.url().includes('#overlay')
  )
  const position = await overlayPage.evaluate(() => ({ x: window.screenX, y: window.screenY }))
  expect(position.y).toBe(20)
  expect(position.x).toBeGreaterThan(0)

  await electronApp.close()
})

test('overlay tab shows overlay testing controls', async () => {
  const electronApp = await launchApp()

  const page = await electronApp.firstWindow()
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Overlay', exact: true }).click()

  await expect(page.getByText('Overlay Testing Suite')).toBeVisible()

  await electronApp.close()
})
