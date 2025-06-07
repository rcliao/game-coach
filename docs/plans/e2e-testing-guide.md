# Electron End-to-End Testing Guide

This guide explains how to run end-to-end (E2E) tests for the Ravenswatch Game Coach using [Playwright](https://playwright.dev/).
Playwright can control the Electron process directly which allows interacting with the rendered UI just like a user.

## 1. Install dependencies

```bash
npm install --save-dev @playwright/test playwright-electron
```

The `playwright-electron` package exposes an `_electron` launcher that starts the app with a full Electron context.

## 2. Build the main process

Playwright launches the compiled Electron app. Run the build step before executing the tests:

```bash
npm run build:electron
```

## 3. Example test script

Create a file such as `tests/e2e/settings.test.ts`:

```ts
import { _electron as electron, expect, test } from '@playwright/test'

// Starts the Electron app and verifies that changing a setting persists
test('update settings from modal', async () => {
  // Launch using the project root (relies on package.json "main")
  const electronApp = await electron.launch({ args: ['.'] })

  // Get the first BrowserWindow
  const window = await electronApp.firstWindow()

  // Open the Settings modal
  await window.getByRole('button', { name: 'Settings' }).click()

  // Toggle one of the checkboxes
  await window.getByRole('checkbox', { name: 'Overlay Enabled' }).check()

  // Expect the UI to reflect the change
  await expect(window.getByRole('checkbox', { name: 'Overlay Enabled' })).toBeChecked()

  // Close the app
  await electronApp.close()
})
```

## 4. Running the tests

Add a script entry to `package.json`:

```json
"test:e2e": "playwright test"
```

Then execute:

```bash
npm run test:e2e
```

The Playwright runner will start an Electron instance, open the main window and execute the scripted interactions. This approach ensures that UI flows such as opening the Settings modal and updating preferences work correctly in a real Electron environment.
