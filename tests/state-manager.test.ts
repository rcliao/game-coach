import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  BrowserWindow: class {},
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => '/tmp') },
}))

import { StateManager } from '../src/main/state-manager'
import type { AppSettings } from '../src/shared/types'
import type { SettingsStorage } from '../src/main/settings-storage'

class MemorySettingsStorage implements SettingsStorage {
  data: Partial<AppSettings> = {}
  load = vi.fn(async () => this.data)
  save = vi.fn(async (settings: AppSettings) => {
    this.data = settings
  })
}

describe('StateManager', () => {

  it('updates settings and persists via storage', async () => {
    const storage = new MemorySettingsStorage()
    const sm = new StateManager({ enableIPC: false, loadSettings: false }, storage)
    sm.setSettings({ overlayEnabled: false })
    expect(sm.getSettings().overlayEnabled).toBe(false)
    expect(storage.save).toHaveBeenCalled()
  })

  it('loads settings from storage', async () => {
    const storage = new MemorySettingsStorage()
    storage.data = { overlayEnabled: false }
    const sm = new StateManager({ enableIPC: false, loadSettings: false }, storage)
    await (sm as any).loadSettingsFromDisk()
    expect(sm.getSettings().overlayEnabled).toBe(false)
  })
})
