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
  const info = await overlayPage.evaluate(() => ({
    x: window.screenX,
    y: window.screenY,
    w: window.outerWidth,
    h: window.outerHeight,
    sw: window.screen.width,
    sh: window.screen.height,
  }))
  const expectedX = Math.round(info.sw * 0.9 - info.w / 2)
  const expectedY = Math.round(info.sh * 0.1 - info.h / 2)
  const clampedX = Math.max(0, Math.min(info.sw - info.w, expectedX))
  const clampedY = Math.max(0, Math.min(info.sh - info.h, expectedY))
  expect(info.x).toBe(clampedX)
  expect(info.y).toBe(clampedY)

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
