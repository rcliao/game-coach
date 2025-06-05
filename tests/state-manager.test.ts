import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  BrowserWindow: class {},
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => '/tmp') },
}))

import { StateManager } from '../src/main/state-manager'
import type { GameDetectionResult, AppSettings } from '../src/shared/types'
import type { SettingsStorage } from '../src/main/settings-storage'

class MemorySettingsStorage implements SettingsStorage {
  data: Partial<AppSettings> = {}
  load = vi.fn(async () => this.data)
  save = vi.fn(async (settings: AppSettings) => {
    this.data = settings
  })
}

describe('StateManager', () => {
  it('updates game detection and notifies subscribers', () => {
    const storage = new MemorySettingsStorage()
    const sm = new StateManager({ enableIPC: false, loadSettings: false }, storage)
    const updates: any[] = []
    sm.subscribe(state => updates.push(state))

    const detection: GameDetectionResult = {
      isGameRunning: true,
      confidence: 1,
      detectionMethod: 'test',
    }

    sm.setGameDetection(detection)

    expect(sm.getGameDetection()).toEqual(detection)
    expect(sm.getGameState().isRavenswatchDetected).toBe(true)
    expect(updates.length).toBeGreaterThanOrEqual(1)
  })

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
