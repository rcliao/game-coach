// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { createSyncGameCoachStore } from '../src/renderer/stores/sync-store'
import type { StateClient } from '../src/renderer/ipc/state-client'

function createMockClient(initialState: any) {
  let updateCb: ((s: any) => void) | undefined
  const client: StateClient = {
    stateGetCurrent: vi.fn().mockResolvedValue(initialState),
    onStateUpdated: vi.fn((cb: (s: any) => void) => { updateCb = cb; return vi.fn() }),
    stateUpdateBulk: vi.fn(),
    stateSetGameDetection: vi.fn().mockResolvedValue({}),
    stateSetGameState: vi.fn().mockResolvedValue({}),
    stateSetAnalyzing: vi.fn().mockResolvedValue({}),
    stateSetLastAnalysis: vi.fn().mockResolvedValue({}),
    stateSetSettings: vi.fn().mockResolvedValue({}),
    stateSetOverlayVisible: vi.fn().mockResolvedValue({}),
    showOverlay: vi.fn().mockResolvedValue(undefined),
    hideOverlay: vi.fn().mockResolvedValue(undefined),
  }
  return { client, getUpdateCb: () => updateCb! }
}

describe('sync-store', () => {
  it('initializes from client and reacts to updates', async () => {
    const initial = {
      gameDetection: null,
      gameState: { isRavenswatchDetected: true, isCapturing: false, currentSourceId: null, lastFrameTime: 0 },
      isAnalyzing: true,
      lastAnalysis: null,
      settings: { overlayEnabled: false },
      isOverlayVisible: true,
    }
    const { client, getUpdateCb } = createMockClient(initial)
    const store = createSyncGameCoachStore(client)
    await store.getState().initializeStore()
    expect(client.stateGetCurrent).toHaveBeenCalled()
    expect(store.getState().isAnalyzing).toBe(true)
    expect(store.getState().isOverlayVisible).toBe(true)

    const updater = getUpdateCb()
    updater({ ...initial, isAnalyzing: false })
    expect(store.getState().isAnalyzing).toBe(false)
  })

  it('forwards state setters to client', async () => {
    const { client } = createMockClient({
      gameDetection: null,
      gameState: { isRavenswatchDetected: false, isCapturing: false, currentSourceId: null, lastFrameTime: 0 },
      isAnalyzing: false,
      lastAnalysis: null,
      settings: { overlayEnabled: true },
      isOverlayVisible: false,
    })
    const store = createSyncGameCoachStore(client)
    const detection = { isGameRunning: true, confidence: 1, detectionMethod: 'test' }
    await store.getState().setGameDetection(detection as any)
    expect(client.stateSetGameDetection).toHaveBeenCalledWith(detection)
  })
})
