import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  BrowserWindow: class {},
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => '/tmp') },
}))

import { StateManager } from '../src/main/state-manager'
import type { GameDetectionResult } from '../src/shared/types'

describe('StateManager', () => {
  it('updates game detection and notifies subscribers', () => {
    const sm = new StateManager({ enableIPC: false, loadSettings: false })
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

  it('updates settings', () => {
    const sm = new StateManager({ enableIPC: false, loadSettings: false })
    sm.setSettings({ overlayEnabled: false })
    expect(sm.getSettings().overlayEnabled).toBe(false)
  })
})
